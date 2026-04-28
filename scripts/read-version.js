#!/usr/bin/env node
const { getCanonicalVersion, getRepoRoot } = require('./version-source');

process.stdout.write(getCanonicalVersion(getRepoRoot()));
