#!/usr/bin/env node
// bin/cli.js

// Suppress deprecation warnings
process.env.NODE_NO_WARNINGS = 1;

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
  .version(packageJson.version); // Use version from package.json

// Define the `commit` command
program
  .command("commit")
  .description("Auto-generate a commit message based on staged changes.")
  .option("-a, --all", "Automatically stage all changes before committing") // Add option to stage all
  .action(async (options) => {
    try {
      await handleCommit(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
