#!/usr/bin/env node
// bin/cli.js

import { Command } from "commander";
import { handleCommit } from "../src/commands/commit.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const program = new Command();

program
  .name("ai-commit")
  .description("CLI tool to auto-generate Git commit messages using AI.")
  .version(packageJson.version);

program
  .command("commit")
  .description("Auto-generate a commit message based on staged changes.")
  .option("-a, --all", "Automatically stage all changes before committing")
  .action(async (options) => {
    try {
      await handleCommit(options);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
