const fs = require('fs');
const path = require('path');

/** Repo root: this file lives in `<repo>/scripts`. */
function getRepoRoot() {
  return path.resolve(__dirname, '..');
}

function normalizeVersion(s) {
  if (!s) return '';
  return String(s)
    .trim()
    .replace(/^refs\/tags\//i, '')
    .replace(/^v/i, '');
}

/**
 * Single source of truth: `.version` at repo root (one line, semver).
 * Fallback: app/package.json version.
 */
function getCanonicalVersion(repoRoot = getRepoRoot()) {
  const vf = path.join(repoRoot, '.version');
  if (fs.existsSync(vf)) {
    const v = normalizeVersion(fs.readFileSync(vf, 'utf8'));
    if (v) return v;
  }
  const pkgPath = path.join(repoRoot, 'app', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const fromPkg = normalizeVersion(pkg.version || '0.0.0');
    return fromPkg || '0.0.0';
  }
  return '0.0.0';
}

module.exports = {
  getRepoRoot,
  normalizeVersion,
  getCanonicalVersion,
};
