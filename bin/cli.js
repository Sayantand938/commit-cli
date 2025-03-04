#!/usr/bin/env node

// Suppress deprecation warnings
process.env.NODE_NO_WARNINGS = 1;

import { Command } from "commander";
import { handleCommit } from "../src/commands/commit.js";

const program = new Command();

program
  .name("ai-commit")
  .description("CLI tool to auto-generate Git commit messages using AI.")
  .version("1.0.0");

// Define the `commit` command
program
  .command("commit")
  .description("Auto-generate a commit message based on staged changes.")
  .action(async () => {
    try {
      await handleCommit();
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
