import dotenv from "dotenv";
import chalk from "chalk";
import simpleGit from "simple-git";
import OpenAI from "openai";
import { confirmCommit } from "../utils/prompts.js";

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error(
    chalk.red("Error: GEMINI_API_KEY is not set in the .env file.")
  );
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Initialize Git client
const git = simpleGit();

// Constants for log messages
const LOG_MESSAGES = {
  STAGING_CHANGES: "Staging all changes...",
  NO_CHANGES_TO_COMMIT: "No changes to commit.",
  GENERATING_COMMIT_MESSAGE: "Generating commit message with AI...",
  REGENERATING_COMMIT_MESSAGE: "Regenerating commit message...",
  COMMIT_SUCCESS: "✔ Commit created successfully!",
  ERROR_DURING_COMMIT: "Error during commit process:",
};

/**
 * Handles the `commit` command.
 * Auto-stages changes, generates a commit message using AI, and commits the changes.
 */
export async function handleCommit() {
  try {
    // Step 1: Auto-stage all changes
    await git.add(".");
    console.log(chalk.blue(LOG_MESSAGES.STAGING_CHANGES));

    // Step 2: Get staged changes
    const status = await git.status();
    if (!status.staged.length) {
      console.log(chalk.yellow(LOG_MESSAGES.NO_CHANGES_TO_COMMIT));
      return;
    }

    // Step 3: Generate and confirm commit message
    let confirmed = false;
    let commitMessage;

    while (!confirmed) {
      const diff = await git.diff(["--staged"]);
      console.log(chalk.blue(LOG_MESSAGES.GENERATING_COMMIT_MESSAGE));
      commitMessage = await generateCommitMessage(diff);

      // Confirm the commit message
      confirmed = await confirmCommit(commitMessage);

      if (!confirmed) {
        console.log(chalk.yellow(LOG_MESSAGES.REGENERATING_COMMIT_MESSAGE));
      }
    }

    // Step 4: Commit changes
    await git.commit(commitMessage);
    console.log(chalk.green(LOG_MESSAGES.COMMIT_SUCCESS));
  } catch (error) {
    console.error(
      chalk.red(`${LOG_MESSAGES.ERROR_DURING_COMMIT} ${error.message}`)
    );
    process.exit(1);
  }
}

/**
 * Generates a commit message using the Gemini API.
 * @param {string} diff - The Git diff of staged changes.
 * @returns {Promise<string>} - The generated commit message.
 */
async function generateCommitMessage(diff) {
  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates concise, standardized Git commit messages. Follow these rules:\n" +
            "- Use the Conventional Commits format: <type>(<scope>): <description>\n" +
            "- Types: feat (✨), fix (🐛), docs (📚), style (🎨), refactor (🛠️), test (✅), chore (🔧)\n" +
            "- Scope is optional but should describe the affected part of the codebase.\n" +
            "- Description should be concise and written in the imperative mood.\n" +
            "- Include an emoji corresponding to the type for better readability.\n" +
            "- Example: ✨ feat(auth): Add login functionality\n" +
            "- Avoid unnecessary details or overly long descriptions.",
        },
        {
          role: "user",
          content: `Generate a concise Git commit message for the following changes:\n\n${diff}`,
        },
      ],
    });

    if (!response.choices || !response.choices[0].message.content) {
      throw new Error("Invalid response from Gemini API.");
    }

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      chalk.red(`Error generating commit message: ${error.message}`)
    );
    throw error;
  }
}
