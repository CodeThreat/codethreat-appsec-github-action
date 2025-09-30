import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';

export class SarifUploader {
  private logger: Logger;
  private octokit: any;

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Initialize Octokit with GitHub token
    const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GitHub token is required for SARIF upload. Please add "github-token: ${{ secrets.GITHUB_TOKEN }}" to action inputs or ensure proper permissions are set.');
    }
    
    this.octokit = github.getOctokit(token);
  }

  /**
   * Upload SARIF file to GitHub Security tab
   */
  async uploadSarif(sarifFilePath: string): Promise<void> {
    try {
      // Validate SARIF file exists and is readable
      if (!await fs.pathExists(sarifFilePath)) {
        throw new Error(`SARIF file not found: ${sarifFilePath}`);
      }

      // Read and validate SARIF content
      const sarifContent = await fs.readFile(sarifFilePath, 'utf8');
      const sarifData = JSON.parse(sarifContent);

      // Validate SARIF format
      this.validateSarifFormat(sarifData);

      // Encode SARIF content for GitHub API
      const sarifBase64 = Buffer.from(sarifContent).toString('base64');

      this.logger.step('SARIF Upload', 'Uploading to GitHub Code Scanning API');

      // Upload to GitHub Code Scanning API
      const uploadResult = await this.octokit.rest.codeScanning.uploadSarif({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        commit_sha: github.context.sha,
        ref: github.context.ref,
        sarif: sarifBase64,
        tool_name: 'CodeThreat',
      });

      this.logger.debug('SARIF upload response', {
        id: uploadResult.data.id,
        url: uploadResult.data.url,
      });

      this.logger.info('✅ SARIF uploaded successfully');
      this.logger.info(`Upload ID: ${uploadResult.data.id}`);
      
      // Provide helpful links
      const securityTabUrl = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/security/code-scanning`;
      this.logger.info(`View results: ${securityTabUrl}`);

    } catch (error) {
      if (error instanceof Error && error.message.includes('Advanced Security')) {
        throw new Error('GitHub Advanced Security is required for SARIF upload. Please enable it in repository settings or set upload-sarif: false');
      }
      
      throw new Error(`SARIF upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate SARIF format
   */
  private validateSarifFormat(sarifData: any): void {
    if (!sarifData.$schema) {
      throw new Error('Invalid SARIF: Missing $schema property');
    }

    if (!sarifData.version) {
      throw new Error('Invalid SARIF: Missing version property');
    }

    if (!Array.isArray(sarifData.runs)) {
      throw new Error('Invalid SARIF: Missing or invalid runs array');
    }

    if (sarifData.runs.length === 0) {
      this.logger.warning('SARIF file contains no runs - this may indicate no results were found');
    }

    // Log SARIF statistics
    const totalResults = sarifData.runs.reduce((sum: number, run: any) => {
      return sum + (Array.isArray(run.results) ? run.results.length : 0);
    }, 0);

    this.logger.debug('SARIF validation passed', {
      version: sarifData.version,
      runs: sarifData.runs.length,
      totalResults,
    });
  }

  /**
   * Check if repository has GitHub Advanced Security enabled
   */
  async checkAdvancedSecurityStatus(): Promise<boolean> {
    try {
      // Try to get code scanning alerts to test if Advanced Security is enabled
      await this.octokit.rest.codeScanning.listAlertsForRepo({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        per_page: 1,
      });
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Advanced Security')) {
        return false;
      }
      // Other errors might be due to no alerts existing, which is fine
      return true;
    }
  }
}
