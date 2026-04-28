#!/usr/bin/env node
/**
 * Create annotated tag v<version> from .version on current HEAD.
 * Does not push the tag.
 */
const { execFileSync } = require('child_process');
const { getCanonicalVersion, getRepoRoot } = require('./version-source');

function main() {
  const repoRoot = getRepoRoot();
  const version = getCanonicalVersion(repoRoot);
  const tagName = `v${version}`;

  let tagExists = false;
  try {
    execFileSync('git', ['show-ref', '--verify', '--quiet', `refs/tags/${tagName}`], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    tagExists = true;
  } catch {
    tagExists = false;
  }

  if (tagExists) {
    process.stdout.write(`[create-version-tag] tag ${tagName} already exists\n`);
    return;
  }

  execFileSync('git', ['tag', '-a', tagName, '-m', `release ${version}`], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  process.stdout.write(`[create-version-tag] created ${tagName}\n`);
}

main();
