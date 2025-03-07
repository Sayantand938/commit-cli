//src/constants.js
export const PROMPT_MESSAGES = {
  CONFIRM_COMMIT: "Use this commit message? (Y/n)", // Simplified prompt
};

// Constants for log messages
export const LOG_MESSAGES = {
  STAGING_CHANGES: " Staging all changes...",
  NO_CHANGES_TO_COMMIT: "No changes to commit.",
  NO_STAGED_CHANGES_TO_COMMIT:
    "No staged changes to commit. Stage changes or use the --all flag.",
  GENERATING_COMMIT_MESSAGE: " Generating commit message with AI...",
  REGENERATING_COMMIT_MESSAGE: "Regenerating commit message...",
  COMMIT_SUCCESS: "Commit created successfully!", // Success message
  ERROR_DURING_COMMIT: "Error during commit process:",
};
