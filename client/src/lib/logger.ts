// client/src/lib/logger.ts
import { apiRequest } from "@/lib/queryClient";

/**
 * Logger utility to track actions throughout the application
 */
export const logger = {
  /**
   * Log a user action
   * @param action The action being performed
   * @param details Additional details about the action
   */
  logAction: async (action: string, details: Record<string, any> = {}) => {
    console.log(`ACTION: ${action}`, details);
    
    // We could also send this to the server for persistent logging
    try {
      await apiRequest("POST", "/api/activity-logs", {
        action,
        description: `User performed action: ${action}`,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      // Silent fail - don't interrupt the user experience for logging
      console.error("Failed to log action to server", error);
    }
  },

  /**
   * Log a button click
   * @param buttonName The name of the button
   * @param location Where the button is located
   * @param additionalData Any additional data to log
   */
  logButtonClick: (buttonName: string, location: string, additionalData: Record<string, any> = {}) => {
    logger.logAction("button_click", {
      button: buttonName,
      location,
      ...additionalData,
    });
  },

  /**
   * Log a function call
   * @param functionName The name of the function
   * @param params Parameters passed to the function
   * @param componentName The component where the function is called
   */
  logFunctionCall: (functionName: string, componentName: string, params: Record<string, any> = {}) => {
    logger.logAction("function_call", {
      function: functionName,
      component: componentName,
      params,
    });
  },

  /**
   * Log a form submission
   * @param formName The name of the form
   * @param success Whether submission was successful
   * @param data Data submitted (be careful not to log sensitive data)
   */
  logFormSubmission: (formName: string, success: boolean, data: Record<string, any> = {}) => {
    // Remove sensitive fields
    const safeData = { ...data };
    
    // Remove password or other sensitive fields if present
    if ('password' in safeData) {
      safeData.password = '********';
    }
    
    logger.logAction("form_submission", {
      form: formName,
      success,
      data: safeData,
    });
  },

  /**
   * Log an error that occurred
   * @param error The error object
   * @param context Context in which the error occurred
   */
  logError: (error: Error | string, context: string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    logger.logAction("error", {
      message: errorMessage,
      context,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};

export default logger;