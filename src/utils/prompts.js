// src/utils/prompts.js
import inquirer from "inquirer";
import chalk from "chalk";
import { PROMPT_MESSAGES } from "../constants.js";
import boxen from "boxen";

/**
 * Prompts the user to confirm the generated commit message.
 * @param {string} message - The generated commit message.
 * @returns {Promise<boolean>} - Whether the user confirmed the message.
 */
export async function confirmCommit(message) {
  try {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: boxen(PROMPT_MESSAGES.CONFIRM_COMMIT.replace("%s", message), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "yellow",
        }),
        default: true,
      },
    ]);

    return confirm;
  } catch (error) {
    console.error(chalk.red(`Error during confirmation: ${error.message}`));
    throw error; // Re-throw the error for consistent handling
  }
}
