#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getCanonicalVersion, getRepoRoot } = require('./version-source');

const repoRoot = getRepoRoot();
const appRoot = path.join(repoRoot, 'app');
const packageJsonPath = path.join(appRoot, 'package.json');
const packageLockPath = path.join(appRoot, 'package-lock.json');
const outSourcePath = path.join(appRoot, 'src', 'generatedVersion.js');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function syncPackageVersions(version) {
  if (!version) return;

  const pkg = readJson(packageJsonPath);
  if (pkg.version !== version) {
    pkg.version = version;
    writeJson(packageJsonPath, pkg);
  }

  if (!fs.existsSync(packageLockPath)) return;
  const lock = readJson(packageLockPath);
  let changed = false;

  if (lock.version !== version) {
    lock.version = version;
    changed = true;
  }

  if (lock.packages && lock.packages[''] && lock.packages[''].version !== version) {
    lock.packages[''].version = version;
    changed = true;
  }

  if (changed) {
    writeJson(packageLockPath, lock);
  }
}

function syncGeneratedSource(version) {
  const content = `const APP_VERSION = '${version}';\n\nexport default APP_VERSION;\n`;
  fs.writeFileSync(outSourcePath, content, 'utf8');
}

function main() {
  const version = getCanonicalVersion(repoRoot);
  syncPackageVersions(version);
  syncGeneratedSource(version);
  process.stdout.write(`[sync-version] synced assets to ${version} from .version\n`);
}

main();
