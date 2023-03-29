#!/usr/bin/env bun

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import gunzip from 'gunzip-file';
import packageJson from './package.json'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

let projectPath = "";
const program = new Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectPath = name
  })

// program.parse();


const tmpDir = os.tmpdir();
console.log('tmpDir', tmpDir);
const tmpFile = path.join(tmpDir, "main.zip");
const res = await fetch("https://github.com/pyrossh/parotta/archive/refs/heads/main.zip");
await Bun.write(tmpFile, res);
await gunzip(tmpFile, os.tmpdir());
