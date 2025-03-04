// src/commands/commit.js
import dotenv from "dotenv";
import chalk from "chalk";
import simpleGit from "simple-git";
import OpenAI from "openai";
import { confirmCommit } from "../utils/prompts.js";
import { LOG_MESSAGES } from "../constants.js";

// Load environment variables
dotenv.config();

// Initialize Git client
const git = simpleGit();

// Initialize OpenAI client
let apiKey = process.env.GEMINI_API_KEY;
let baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/"; // Default to Gemini base URL
let model = process.env.AI_COMMIT_MODEL || "gemini-2.0-flash"; // Use gemini-pro as default

if (!apiKey) {
  apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    baseURL = undefined; // Use the default OpenAI base URL
    model = process.env.AI_COMMIT_MODEL || "gpt-4o-mini"; // If it's an OpenAI key, default to a standard OpenAI model
  }
}

if (!apiKey) {
  console.error(
    chalk.red(
      "Error: Neither GEMINI_API_KEY nor OPENAI_API_KEY is set in the .env file."
    )
  );
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  baseURL, // Use the dynamically set baseURL
});

/**
 * Handles the `commit` command.
 * Auto-stages changes (optional), generates a commit message, and commits.
 */
export async function handleCommit(options) {
  try {
    // Step 1: Stage changes (if --all is passed)
    if (options.all) {
      await git.add(".");
      console.log(chalk.blue(LOG_MESSAGES.STAGING_CHANGES));
    }

    // Step 2: Check for staged changes
    const status = await git.status();
    if (!status.files.length) {
      // Check for ANY changes (staged OR unstaged if using -a)
      console.log(chalk.yellow(LOG_MESSAGES.NO_CHANGES_TO_COMMIT));
      return;
    }
    const stagedChanges = status.staged;

    if (!stagedChanges.length && !options.all) {
      console.log(chalk.yellow(LOG_MESSAGES.NO_STAGED_CHANGES_TO_COMMIT));
      return;
    }

    // Step 3: Generate and confirm commit message
    let confirmed = false;
    let commitMessage;

    while (!confirmed) {
      const diff = await git.diff(["--staged"]); // Always use staged changes for the diff
      console.log(chalk.blue(LOG_MESSAGES.GENERATING_COMMIT_MESSAGE));
      commitMessage = await generateCommitMessage(diff);

      confirmed = await confirmCommit(commitMessage);

      if (!confirmed) {
        console.log(chalk.yellow(LOG_MESSAGES.REGENERATING_COMMIT_MESSAGE));
      }
    }

    // Step 4: Commit changes
    await git.commit(commitMessage);
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
      model: model, // Use the configured model
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates concise, standardized Git commit messages. Follow these rules:\n" +
            "- Use the Conventional Commits format: <type>(<scope>): <description>\n" +
            "- Types: feat (✨), fix (🐛), docs (📚), style (🎨), refactor (🛠️), test (✅), chore (🔧)\n" +
            "- Scope is optional but should describe the affected part of the codebase.\n" +
            "- Description should be concise and written in the imperative mood.\n" +
            "- Consider adding emojis for better readability.\n" +
            "- Example: ✨ feat(auth): Add login functionality\n" +
            "Keep it brief!",
        },
        {
          role: "user",
          content: `Generate a Git commit message for the following changes:\n\n${diff}`,
        },
      ],
    });

    if (!response.choices || !response.choices[0].message.content) {
      throw new Error("Invalid response from Gemini API. No content returned.");
    }

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(
      chalk.red(`Error generating commit message: ${error.message}`)
    );
    throw error; // Re-throw for consistent error handling
  }
}
