import inquirer from "inquirer";

// Constants for prompt messages
const PROMPT_MESSAGES = {
  CONFIRM_COMMIT:
    'Use this commit message?\n"%s"\nPress "Y" to confirm or "N" to regenerate.',
};

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
        message: PROMPT_MESSAGES.CONFIRM_COMMIT.replace("%s", message),
        default: true,
      },
    ]);

    return confirm;
  } catch (error) {
    console.error(chalk.red(`Error during confirmation: ${error.message}`));
    throw error;
  }
}
