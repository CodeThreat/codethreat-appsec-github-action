import * as core from '@actions/core';

export class Logger {
  private verbose: boolean;

  constructor(verbose?: boolean) {
    this.verbose = verbose ?? core.getBooleanInput('verbose');
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    core.info(message);
    if (data && this.verbose) {
      core.info(`  Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Log warning message
   */
  warning(message: string, data?: any): void {
    core.warning(message);
    if (data && this.verbose) {
      core.info(`  Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Log error message
   */
  error(message: string, data?: any): void {
    core.error(message);
    if (data) {
      core.error(`  Error Details: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Log debug message (only shown in verbose mode)
   */
  debug(message: string, data?: any): void {
    if (this.verbose) {
      core.info(`[DEBUG] ${message}`);
      if (data) {
        core.info(`  Debug Data: ${JSON.stringify(data, null, 2)}`);
      }
    }
  }

  /**
   * Start a group for organized logging
   */
  startGroup(title: string): void {
    core.startGroup(title);
  }

  /**
   * End the current group
   */
  endGroup(): void {
    core.endGroup();
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.verbose;
  }

  /**
   * Log step progress
   */
  step(stepName: string, message?: string): void {
    const fullMessage = message ? `${stepName}: ${message}` : stepName;
    core.info(`🔄 ${fullMessage}`);
  }

  /**
   * Log success step
   */
  success(stepName: string, message?: string): void {
    const fullMessage = message ? `${stepName}: ${message}` : stepName;
    core.info(`✅ ${fullMessage}`);
  }

  /**
   * Log failure step
   */
  failure(stepName: string, message?: string): void {
    const fullMessage = message ? `${stepName}: ${message}` : stepName;
    core.error(`❌ ${fullMessage}`);
  }
}
