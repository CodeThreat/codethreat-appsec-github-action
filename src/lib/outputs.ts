import * as core from '@actions/core';

export interface ActionOutputs {
  scanId: string;
  repositoryId: string;
  resultsFile?: string;
  violationCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  securityScore?: number;
  scanDuration?: number;
  scanUrl?: string;
}

/**
 * Set GitHub Action outputs
 */
export function setOutputs(outputs: ActionOutputs): void {
  core.setOutput('scan-id', outputs.scanId);
  core.setOutput('repository-id', outputs.repositoryId);
  core.setOutput('violation-count', outputs.violationCount.toString());
  core.setOutput('critical-count', outputs.criticalCount.toString());
  core.setOutput('high-count', outputs.highCount.toString());
  core.setOutput('medium-count', outputs.mediumCount.toString());
  core.setOutput('low-count', outputs.lowCount.toString());

  if (outputs.resultsFile) {
    core.setOutput('results-file', outputs.resultsFile);
  }

  if (outputs.securityScore !== undefined) {
    core.setOutput('security-score', outputs.securityScore.toString());
  }

  if (outputs.scanDuration !== undefined) {
    core.setOutput('scan-duration', outputs.scanDuration.toString());
  }

  if (outputs.scanUrl) {
    core.setOutput('scan-url', outputs.scanUrl);
  }
}
