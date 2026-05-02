#!/usr/bin/env node
/**
 * Builds app/src/generatedProjects.js from app/content/projects/*.mdx
 * YAML frontmatter is parsed with the same remark stack as compile (remark-frontmatter).
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { getRepoRoot } = require('./version-source');

const repoRoot = getRepoRoot();
const appRoot = path.join(repoRoot, 'app');
const contentDir = path.join(appRoot, 'content', 'projects');
const outPath = path.join(appRoot, 'src', 'generatedProjects.js');

function resolveFromApp(specifier) {
  return require.resolve(specifier, { paths: [appRoot] });
}

function readProjectFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.mdx'))
    .map((name) => path.join(dirPath, name));
}

function extractYamlMeta(tree, absPath) {
  const yamlNode = tree.children?.find((node) => node.type === 'yaml');
  if (!yamlNode || typeof yamlNode.value !== 'string') {
    throw new Error(`Missing or invalid YAML frontmatter in ${absPath}`);
  }
  const { parse } = require(resolveFromApp('yaml'));
  return parse(yamlNode.value);
}

async function parseMdxFrontmatter(raw, absPath) {
  const { unified } = await import(pathToFileURL(resolveFromApp('unified')).href);
  const remarkParse = (await import(pathToFileURL(resolveFromApp('remark-parse')).href)).default;
  const remarkFrontmatter = (await import(pathToFileURL(resolveFromApp('remark-frontmatter')).href)).default;
  const remarkMdx = (await import(pathToFileURL(resolveFromApp('remark-mdx')).href)).default;

  const tree = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx).parse(raw);
  const meta = extractYamlMeta(tree, absPath);
  return meta;
}

function normalizeArticle(meta, fullSource, absPath) {
  const title = String(meta.title ?? '').trim();
  const slug = String(meta.slug ?? '').trim();
  const summary = String(meta.summary ?? '').trim();
  const date = String(meta.date ?? '').trim();
  const thumbnail = String(meta.thumbnail ?? '').trim();
  const tags = Array.isArray(meta.tags) ? meta.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  const published = Boolean(meta.published);

  if (!title || !slug) {
    throw new Error(`Missing required frontmatter 'title' or 'slug' in ${absPath}`);
  }

  return {
    title,
    slug,
    summary,
    date,
    thumbnail,
    tags,
    published,
    source: fullSource,
  };
}

function byDateDesc(a, b) {
  return String(b.date || '').localeCompare(String(a.date || ''));
}

function generateModule(articles) {
  const serialized = JSON.stringify(articles, null, 2);
  return `export const allProjectArticles = ${serialized};

export const publishedProjectArticles = allProjectArticles
  .filter((article) => article.published)
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

export function getPublishedProjectBySlug(slug) {
  return publishedProjectArticles.find((article) => article.slug === slug) || null;
}
`;
}

async function main() {
  const files = readProjectFiles(contentDir);
  const articles = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const meta = await parseMdxFrontmatter(raw, filePath);
    articles.push(normalizeArticle(meta, raw, filePath));
  }

  articles.sort(byDateDesc);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, generateModule(articles), 'utf8');
  process.stdout.write(`[sync-project-articles] synced ${articles.length} article(s)\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
