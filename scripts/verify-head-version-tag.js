#!/usr/bin/env node
const { execFileSync } = require('child_process');
const { getCanonicalVersion, getRepoRoot } = require('./version-source');

function getHeadTags(repoRoot) {
  const output = execFileSync('git', ['tag', '--points-at', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function main() {
  const repoRoot = getRepoRoot();
  const version = getCanonicalVersion(repoRoot);
  const expectedTag = `v${version}`;
  const headTags = getHeadTags(repoRoot);

  if (headTags.includes(expectedTag)) {
    process.stdout.write(`[verify-head-version-tag] HEAD has required tag ${expectedTag}\n`);
    return;
  }

  const available = headTags.length ? headTags.join(', ') : '(none)';
  process.stderr.write(
    `[verify-head-version-tag] Refusing push: expected HEAD tag ${expectedTag} to match .version (${version}), but found ${available}\n`,
  );
  process.exit(1);
}

main();
