import * as core from '@actions/core';
import * as github from '@actions/github';
import { CodeThreatAction } from './lib/action';
import { ActionInputs, parseInputs } from './lib/inputs';
import { ActionOutputs, setOutputs } from './lib/outputs';
import { Logger } from './lib/logger';

/**
 * Main entry point for the GitHub Action
 */
async function run(): Promise<void> {
  const logger = new Logger();
  
  try {
    logger.info('🚀 Starting CodeThreat Security Scan Action');
    logger.info(`Repository: ${github.context.repo.owner}/${github.context.repo.repo}`);
    logger.info(`Branch: ${github.context.ref}`);
    logger.info(`Event: ${github.context.eventName}`);

    // Parse and validate inputs
    const inputs: ActionInputs = parseInputs();
    logger.debug('Action inputs parsed successfully', { 
      scanTypes: inputs.scanTypes,
      outputFormat: inputs.outputFormat,
      waitForCompletion: inputs.waitForCompletion 
    });

    // Initialize the action handler
    const action = new CodeThreatAction(inputs, logger);

    // Execute the security scan
    const outputs: ActionOutputs = await action.execute();

    // Set GitHub Action outputs
    setOutputs(outputs);

    // Log success summary
    logger.info('✅ CodeThreat Security Scan completed successfully');
    logger.info(`Scan ID: ${outputs.scanId}`);
    logger.info(`Violations: ${outputs.violationCount} (Critical: ${outputs.criticalCount}, High: ${outputs.highCount})`);
    
    if (outputs.securityScore) {
      logger.info(`Security Score: ${outputs.securityScore}/100`);
    }

    if (outputs.resultsFile) {
      logger.info(`Results saved to: ${outputs.resultsFile}`);
    }

    if (outputs.scanUrl) {
      logger.info(`View detailed results: ${outputs.scanUrl}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('❌ CodeThreat Security Scan failed', { error: errorMessage });
    
    if (logger.isDebugEnabled()) {
      logger.debug('Error stack trace', { stack: errorStack });
    }

    // Set the action as failed
    core.setFailed(errorMessage);
  }
}

// Execute the action
if (require.main === module) {
  run().catch(error => {
    console.error('Fatal error in action execution:', error);
    process.exit(1);
  });
}

export { run };
