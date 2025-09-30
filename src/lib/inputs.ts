import * as core from '@actions/core';
import * as github from '@actions/github';
import { Logger } from './logger';

export interface ActionInputs {
  // Authentication
  apiKey: string;
  serverUrl: string;
  organizationSlug: string;

  // Repository configuration
  repositoryUrl: string;
  branch: string;

  // Scan configuration
  scanTypes: string[]; // Always empty array - backend decides
  waitForCompletion: boolean;
  timeout: number; // in seconds
  pollInterval: number; // in seconds

  // Output configuration
  outputFormat: string;
  outputFile: string;
  uploadSarif: boolean;

  // CI/CD behavior
  failOnCritical: boolean;
  failOnHigh: boolean;
  maxViolations: number;

  // Advanced options
  skipImport: boolean;
  verbose: boolean;
}

/**
 * Parse and validate GitHub Action inputs
 */
export function parseInputs(): ActionInputs {
  const logger = new Logger();

  // Required inputs
  const apiKey = core.getInput('api-key', { required: true });
  if (!apiKey) {
    throw new Error('API key is required. Please set the api-key input or CT_API_KEY secret.');
  }

  const organizationSlug = core.getInput('organization-slug', { required: true });
  if (!organizationSlug) {
    throw new Error('Organization slug is required. Please provide your CodeThreat organization slug.');
  }

  // Scan types - always empty array (backend decides based on organization config)
  // This matches Azure DevOps and Jenkins behavior
  const scanTypes: string[] = [];

  // Parse boolean inputs
  const waitForCompletion = core.getBooleanInput('wait-for-completion');
  const uploadSarif = core.getBooleanInput('upload-sarif');
  const failOnCritical = core.getBooleanInput('fail-on-critical');
  const failOnHigh = core.getBooleanInput('fail-on-high');
  const skipImport = core.getBooleanInput('skip-import');
  const verbose = core.getBooleanInput('verbose');

  // Parse numeric inputs (timeout is now in seconds, matching Azure DevOps)
  const timeout = parseInt(core.getInput('timeout') || '43200'); // 12 hours default
  const pollInterval = parseInt(core.getInput('poll-interval') || '30'); // 30 seconds default
  const maxViolations = parseInt(core.getInput('max-violations') || '0');

  // Validate numeric inputs
  if (timeout < 60 || timeout > 86400) {
    throw new Error('Timeout must be between 60 and 86400 seconds (1 minute to 24 hours)');
  }

  if (pollInterval < 10 || pollInterval > 60) {
    throw new Error('Poll interval must be between 10 and 60 seconds');
  }

  // Parse output format
  const outputFormat = core.getInput('output-format') || 'sarif';
  const validFormats = ['json', 'sarif', 'csv', 'xml', 'junit'];
  if (!validFormats.includes(outputFormat)) {
    throw new Error(`Invalid output format: ${outputFormat}. Valid formats: ${validFormats.join(', ')}`);
  }

  // Determine output file extension
  const outputFile = core.getInput('output-file') || `codethreat-results.${outputFormat === 'junit' ? 'xml' : outputFormat}`;

  // Get repository information from GitHub context
  const repositoryUrl = core.getInput('repository-url') || `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`;
  const branch = core.getInput('branch') || github.context.ref.replace('refs/heads/', '');

  const inputs: ActionInputs = {
    // Authentication
    apiKey,
    serverUrl: core.getInput('server-url', { required: true }),
    organizationSlug,

    // Repository configuration
    repositoryUrl,
    branch,

    // Scan configuration
    scanTypes, // Always empty array
    waitForCompletion,
    timeout, // Now in seconds
    pollInterval,

    // Output configuration
    outputFormat,
    outputFile,
    uploadSarif,

    // CI/CD behavior
    failOnCritical,
    failOnHigh,
    maxViolations,

    // Advanced options
    skipImport,
    verbose,
  };

  // Log parsed inputs (without sensitive data)
  logger.debug('Parsed action inputs', {
    serverUrl: inputs.serverUrl,
    repositoryUrl: inputs.repositoryUrl,
    branch: inputs.branch,
    scanTypes: inputs.scanTypes,
    outputFormat: inputs.outputFormat,
    waitForCompletion: inputs.waitForCompletion,
    timeout: inputs.timeout,
    apiKeySet: !!inputs.apiKey,
  });

  return inputs;
}
