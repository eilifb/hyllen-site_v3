#!/usr/bin/env node
/**
 * Create annotated tag v<version> from .version if missing, then git push origin <tag>.
 */
const { execFileSync } = require('child_process');
const { getCanonicalVersion, getRepoRoot } = require('./version-source');

function main() {
  const repoRoot = getRepoRoot();
  const v = getCanonicalVersion(repoRoot);
  const tagName = `v${v}`;

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

  if (!tagExists) {
    execFileSync('git', ['tag', '-a', tagName, '-m', `release ${v}`], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    process.stderr.write(`[git-release-tag] created ${tagName}\n`);
  } else {
    process.stderr.write(`[git-release-tag] tag ${tagName} already exists (skipped)\n`);
  }

  execFileSync('git', ['push', 'origin', tagName], { cwd: repoRoot, stdio: 'inherit' });
}

main();
