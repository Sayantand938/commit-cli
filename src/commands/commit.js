// src/commands/commit.js
import dotenv from "dotenv";
import simpleGit from "simple-git";
import OpenAI from "openai";
import { confirmCommit } from "../utils/prompts.js";
import { LOG_MESSAGES, PROMPT_MESSAGES } from "../constants.js";
import ora from "ora";
import inquirer from "inquirer";

// Load environment variables
dotenv.config();

// Initialize Git client
const git = simpleGit();

// Initialize OpenAI client
let apiKey = process.env.GEMINI_API_KEY;
let baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
let model = process.env.AI_COMMIT_MODEL || "gemini-2.0-flash";

if (!apiKey) {
  apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    baseURL = undefined;
    model = process.env.AI_COMMIT_MODEL || "gpt-4o-mini";
  }
}

if (!apiKey) {
  console.error(
    "Error: Neither GEMINI_API_KEY nor OPENAI_API_KEY is set in the .env file."
  );
  process.exit(1);
}

const openai = new OpenAI({ apiKey, baseURL });

export async function handleCommit(options) {
  try {
    // --- Staging ---
    if (options.all) {
      const spinner = ora({
        text: LOG_MESSAGES.STAGING_CHANGES,
        spinner: "dots",
        succeedText: "",
      }).start();
      await git.add(".");
      spinner.succeed(LOG_MESSAGES.STAGING_CHANGES);
    }

    const status = await git.status();
    if (!status.files.length) {
      console.log(LOG_MESSAGES.NO_CHANGES_TO_COMMIT);
      return;
    }
    const stagedChanges = status.staged;

    if (!stagedChanges.length && !options.all) {
      console.log(LOG_MESSAGES.NO_STAGED_CHANGES_TO_COMMIT);
      return;
    }

    // --- Generate Message ---
    const diff = await git.diff(["--staged"]);
    const spinner = ora({
      text: LOG_MESSAGES.GENERATING_COMMIT_MESSAGE,
      spinner: "dots",
      succeedText: "",
    }).start();
    let commitMessage = await generateCommitMessage(diff);
    spinner.succeed(LOG_MESSAGES.GENERATING_COMMIT_MESSAGE);
    console.log(); // Spacing

    // --- Display Message ---
    const separator = "=".repeat(process.stdout.columns || 80); // Full width separator
    console.log(separator);
    console.log(commitMessage);
    console.log(separator);
    console.log(); // Spacing

    // --- Confirmation Prompt ---
    let confirmed = await confirmCommit();
    console.log(); //spacing
    while (!confirmed) {
      const spinner2 = ora({
        text: LOG_MESSAGES.REGENERATING_COMMIT_MESSAGE,
        spinner: "dots",
        succeedText: "",
      }).start();
      const diff = await git.diff(["--staged"]);
      commitMessage = await generateCommitMessage(diff);
      spinner2.succeed(LOG_MESSAGES.REGENERATING_COMMIT_MESSAGE);
      console.log(); //spacing
      console.log(separator);
      console.log(commitMessage);
      console.log(separator);
      console.log(); //spacing

      confirmed = await confirmCommit();
      console.log(); //spacing
    }
    // --- Commit ---
    const commitSpinner = ora({
      text: "Committing...",
      spinner: "dots",
      succeedText: "",
    }).start();
    await git.commit(commitMessage);
    commitSpinner.succeed();
    console.log(LOG_MESSAGES.COMMIT_SUCCESS);
  } catch (error) {
    console.error(`${LOG_MESSAGES.ERROR_DURING_COMMIT} ${error.message}`);
    process.exit(1);
  }
}

// generateCommitMessage function (no changes - already plain text)
async function generateCommitMessage(diff) {
  try {
    const response = await openai.chat.completions.create({
      model: model,
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
    console.error(`Error generating commit message: ${error.message}`);
    throw error;
  }
}
