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
    const boxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
      backgroundColor: "#222222", // Dark background
    };

    const formattedMessage = boxen(chalk.cyan(message), boxenOptions);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: PROMPT_MESSAGES.CONFIRM_COMMIT.replace("%s", formattedMessage), // Use formatted message
        default: true,
      },
    ]);

    return confirm;
  } catch (error) {
    console.error(chalk.red(`Error during confirmation: ${error.message}`));
    throw error; // Re-throw the error for consistent handling
  }
}
