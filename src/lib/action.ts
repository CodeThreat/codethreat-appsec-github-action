import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeThreatApiClient } from '@codethreat/appsec-cli';
import { ActionInputs } from './inputs';
import { ActionOutputs } from './outputs';
import { Logger } from './logger';
import { SarifUploader } from './sarif-uploader';

export class CodeThreatAction {
  private inputs: ActionInputs;
  private logger: Logger;
  private apiClient: CodeThreatApiClient;
  private sarifUploader: SarifUploader;

  constructor(inputs: ActionInputs, logger: Logger) {
    this.inputs = inputs;
    this.logger = logger;
    
    // Initialize API client with environment variables
    this.setupEnvironment();
    this.apiClient = new CodeThreatApiClient();
    this.sarifUploader = new SarifUploader(logger);
  }

  /**
   * Setup environment variables for CLI
   */
  private setupEnvironment(): void {
    process.env.CT_API_KEY = this.inputs.apiKey;
    process.env.CT_SERVER_URL = this.inputs.serverUrl;
    process.env.CT_ORG_SLUG = this.inputs.organizationSlug;
    
    if (this.inputs.verbose) {
      process.env.CT_VERBOSE = 'true';
    }

    // CLI behavior for CI/CD
    process.env.CT_COLORS = 'false'; // Disable colors in CI
  }

  /**
   * Execute the complete CodeThreat security scan workflow
   */
  async execute(): Promise<ActionOutputs> {
    let repositoryId: string;
    let scanId: string;

    try {
      // Step 1: Validate authentication
      this.logger.startGroup('🔐 Authentication');
      await this.validateAuthentication();
      this.logger.success('Authentication', 'Valid');
      this.logger.endGroup();

      // Step 2: Import or find repository
      this.logger.startGroup('📁 Repository Setup');
      repositoryId = await this.setupRepository();
      this.logger.success('Repository Setup', `Repository ID: ${repositoryId}`);
      this.logger.endGroup();

      // Step 3: Execute security scan
      this.logger.startGroup('🔍 Security Scan');
      scanId = await this.executeScan(repositoryId);
      this.logger.success('Security Scan', `Scan ID: ${scanId}`);
      this.logger.endGroup();

      // Step 4: Export and process results
      this.logger.startGroup('📊 Results Processing');
      const results = await this.processResults(scanId);
      this.logger.success('Results Processing', `${results.violationCount} violations found`);
      this.logger.endGroup();

      // Step 5: Upload SARIF if requested
      if (this.inputs.uploadSarif && this.inputs.outputFormat === 'sarif' && results.resultsFile) {
        this.logger.startGroup('📤 SARIF Upload');
        await this.uploadSarifResults(results.resultsFile);
        this.logger.success('SARIF Upload', 'Results uploaded to GitHub Security tab');
        this.logger.endGroup();
      }

      // Step 6: Check failure conditions
      this.checkFailureConditions(results);

      return {
        ...results,
        repositoryId,
        scanId,
      };

    } catch (error) {
      this.logger.error('Action execution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Validate CodeThreat authentication
   */
  private async validateAuthentication(): Promise<void> {
    try {
      this.logger.step('Validating API credentials');
      
      await this.apiClient.validateAuth({
        includePermissions: false,
        includeOrganizations: false,
        includeUsage: false
      });

      this.logger.info('✅ Authentication validated successfully');

    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup repository (import or find existing)
   * Uses backend's advanced URL matching for flexible repository detection
   */
  private async setupRepository(): Promise<string> {
    try {
      // Normalize the repository URL to standard HTTPS format
      const normalizedUrl = this.normalizeGitHubUrl(this.inputs.repositoryUrl);
      
      this.logger.step('Repository Setup', `Finding repository: ${normalizedUrl}`);

      // Try to find existing repository with advanced backend URL matching
      // Backend handles various URL formats:
      // - https://github.com/owner/repo.git
      // - https://github.com/owner/repo
      // - git@github.com:owner/repo.git
      // - git://github.com/owner/repo.git
      // - Different protocols, trailing slashes, etc.
      
      try {
        const importResult = await this.apiClient.importRepository({
          url: normalizedUrl,
          organizationSlug: this.inputs.organizationSlug,
          name: this.extractRepoName(normalizedUrl),
          branch: this.inputs.branch,
          provider: 'github',
          autoScan: false, // We'll trigger scan manually
          scanTypes: [], // Always empty - backend decides
          isPrivate: false, // GitHub context doesn't expose this easily
        });

        // Check if repository already exists in organization
        if (importResult.alreadyExists) {
          this.logger.info(`✅ Repository found in organization: ${importResult.repository.name}`);
          this.logger.info(`   Repository ID: ${importResult.repository.id}`);
          
          if (this.inputs.skipImport) {
            this.logger.debug('Skip import enabled - using existing repository');
          }
          
          this.logger.debug('Repository details', {
            id: importResult.repository.id,
            name: importResult.repository.name,
            fullName: importResult.repository.fullName,
            provider: importResult.repository.provider,
            url: importResult.repository.url,
          });

          return importResult.repository.id;
        } else {
          // Repository was auto-imported (not found in existing repositories)
          this.logger.warning(`⚠️ Repository was auto-imported - this means it wasn't pre-imported in CodeThreat`);
          this.logger.info(`✅ Repository created: ${importResult.repository.name}`);
          this.logger.info(`   Repository ID: ${importResult.repository.id}`);
          this.logger.info(`   💡 Tip: Pre-import repositories via CodeThreat web interface for better organization`);
          
          this.logger.debug('New repository details', {
            id: importResult.repository.id,
            name: importResult.repository.name,
            provider: importResult.repository.provider,
          });

          return importResult.repository.id;
        }

      } catch (importError) {
        const errorMessage = importError instanceof Error ? importError.message : 'Unknown error';
        
        // Provide helpful error message
        throw new Error(
          `Repository import failed: ${errorMessage}\n` +
          `\nOriginal URL: ${this.inputs.repositoryUrl}` +
          `\nNormalized URL: ${normalizedUrl}` +
          `\nOrganization: ${this.inputs.organizationSlug}` +
          `\n\n💡 Troubleshooting:` +
          `\n1. Verify the repository URL is correct` +
          `\n2. Check that the organization slug is correct` +
          `\n3. Ensure your API key has permission to import repositories` +
          `\n4. Import the repository manually via CodeThreat web interface first` +
          `\n5. Make sure the repository exists in your CodeThreat organization` +
          `\n\n🔗 The backend supports flexible URL matching for GitHub repositories.`
        );
      }

    } catch (error) {
      throw new Error(`Repository setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize GitHub repository URL
   * Converts various formats to standard HTTPS format
   */
  private normalizeGitHubUrl(url: string): string {
    if (!url) return url;
    
    // Handle git:// protocol (convert to https://)
    // git://github.com/owner/repo.git -> https://github.com/owner/repo.git
    url = url.replace(/^git:\/\//, 'https://');
    
    // Handle SSH format (convert to HTTPS)
    // git@github.com:owner/repo.git -> https://github.com/owner/repo.git
    url = url.replace(/^git@github\.com:/, 'https://github.com/');
    
    // Ensure HTTPS protocol
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      // If no protocol, assume it's github.com path
      if (url.startsWith('github.com')) {
        url = 'https://' + url;
      }
    }
    
    // Ensure .git extension for consistency
    if (!url.endsWith('.git')) {
      url = url + '.git';
    }
    
    this.logger.debug('URL normalized', { 
      original: arguments[0], 
      normalized: url 
    });
    
    return url;
  }

  /**
   * Extract repository name from URL
   * Handles various GitHub URL formats
   */
  private extractRepoName(url: string): string {
    if (!url) return 'unknown-repository';
    
    // Handle GitHub URLs
    // Examples:
    // - https://github.com/owner/repo.git -> repo
    // - https://github.com/owner/repo -> repo
    // - git@github.com:owner/repo.git -> repo
    // - git://github.com/owner/repo.git -> repo
    
    // Remove .git extension if present
    let cleanUrl = url.replace(/\.git$/, '');
    
    // Remove protocol
    cleanUrl = cleanUrl.replace(/^(https?|git|ssh):\/\//, '');
    cleanUrl = cleanUrl.replace(/^git@/, '');
    
    // Extract repo name from various formats
    const githubMatch = cleanUrl.match(/github\.com[:/][\w-]+\/([\w-]+)/);
    if (githubMatch) {
      return githubMatch[1];
    }
    
    // Fallback: get last segment of URL
    const segments = cleanUrl.split('/').filter(s => s.length > 0);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
    
    return 'unknown-repository';
  }

  /**
   * Execute security scan
   */
  private async executeScan(repositoryId: string): Promise<string> {
    try {
      this.logger.step('Scan Execution', `Starting comprehensive security scan`);

      const scanResult = await this.apiClient.runScan({
        repositoryId,
        organizationSlug: this.inputs.organizationSlug,
        branch: this.inputs.branch,
        scanTypes: [], // Always empty array - backend decides based on org config
        wait: this.inputs.waitForCompletion,
        timeout: this.inputs.timeout, // Already in seconds
        pollInterval: this.inputs.pollInterval,
        scanTrigger: 'github_actions' as any, // Platform-specific trigger
        commitSha: github.context.sha,
        metadata: {
          'github.actor': github.context.actor,
          'github.workflow': github.context.workflow,
          'github.run_id': github.context.runId.toString(),
          'github.event_name': github.context.eventName,
        }
      });

      if (scanResult.synchronous) {
        const duration = scanResult.duration || 0;
        this.logger.info(`✅ Scan completed in ${duration} seconds`);
        
        if (scanResult.results) {
          this.logger.info(`Violations found: ${scanResult.results.total} (Critical: ${scanResult.results.critical}, High: ${scanResult.results.high})`);
          
          // Get detailed results for violation type breakdown
          try {
            const detailedResults = await this.apiClient.exportScanResults({
              scanId: scanResult.scan.id,
              format: 'json',
              includeMetadata: true
            });
            
            // Log violation type breakdown if available
            if (detailedResults.results && typeof detailedResults.results === 'object') {
              const results = detailedResults.results as any;
              if (results.violations && Array.isArray(results.violations)) {
                const typeBreakdown: Record<string, number> = {};
                results.violations.forEach((violation: any) => {
                  const type = violation.type || 'UNKNOWN';
                  typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
                });
                
                if (Object.keys(typeBreakdown).length > 0) {
                  this.logger.info('📊 Violation Types:');
                  Object.entries(typeBreakdown).forEach(([type, count]) => {
                    const friendlyName = this.getViolationTypeFriendlyName(type);
                    this.logger.info(`   ${friendlyName}: ${count}`);
                  });
                }
              }
            }
          } catch (error) {
            this.logger.debug('Could not fetch violation type breakdown', { 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      } else {
        this.logger.info('✅ Scan started asynchronously');
        this.logger.warning('Consider setting wait-for-completion: true for CI/CD workflows');
      }

      return scanResult.scan.id;

    } catch (error) {
      throw new Error(`Scan execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process and export scan results
   */
  private async processResults(scanId: string): Promise<Omit<ActionOutputs, 'repositoryId' | 'scanId'>> {
    try {
      this.logger.step('Results Export', `Exporting in ${this.inputs.outputFormat} format`);

      // Get scan results
      const scanResults = await this.apiClient.exportScanResults({
        scanId,
        format: this.inputs.outputFormat as any,
        includeMetadata: true,
        includeFixed: false,
        includeSuppressed: false,
      });

      // Write results to file
      const outputPath = path.resolve(this.inputs.outputFile);
      const resultsData = typeof scanResults.results === 'string' 
        ? scanResults.results 
        : JSON.stringify(scanResults.results, null, 2);
      await fs.writeFile(outputPath, resultsData);

      this.logger.info(`✅ Results saved to: ${outputPath}`);

      // Extract summary information
      const summary = scanResults.summary || {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      // Generate scan URL
      const scanUrl = this.generateScanUrl(scanId, scanResults.scan.repository.id);

      return {
        resultsFile: outputPath,
        violationCount: summary.total,
        criticalCount: summary.critical,
        highCount: summary.high,
        mediumCount: summary.medium,
        lowCount: summary.low,
        securityScore: scanResults.scan.securityScore,
        scanDuration: scanResults.scan.scanDuration,
        scanUrl,
      };

    } catch (error) {
      throw new Error(`Results processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload SARIF results to GitHub Security tab
   */
  private async uploadSarifResults(resultsFile: string): Promise<void> {
    try {
      this.logger.step('SARIF Upload', 'Uploading to GitHub Security tab');

      await this.sarifUploader.uploadSarif(resultsFile);
      
      this.logger.info('✅ SARIF results uploaded successfully');
      this.logger.info('Results will appear in the GitHub Security tab');

    } catch (error) {
      // Don't fail the entire action if SARIF upload fails
      this.logger.warning(`SARIF upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.logger.info('Scan results are still available in the output file');
    }
  }

  /**
   * Check if build should fail based on violation counts
   */
  private checkFailureConditions(results: Omit<ActionOutputs, 'repositoryId' | 'scanId'>): void {
    const { criticalCount, highCount, violationCount } = results;

    if (this.inputs.failOnCritical && criticalCount > 0) {
      throw new Error(`Build failed: ${criticalCount} critical vulnerabilities found`);
    }

    if (this.inputs.failOnHigh && highCount > 0) {
      throw new Error(`Build failed: ${highCount} high severity vulnerabilities found`);
    }

    if (this.inputs.maxViolations > 0 && violationCount > this.inputs.maxViolations) {
      throw new Error(`Build failed: ${violationCount} violations exceed maximum allowed (${this.inputs.maxViolations})`);
    }

    // Log success conditions
    if (criticalCount === 0) {
      this.logger.info('✅ No critical vulnerabilities found');
    }

    if (highCount === 0 || !this.inputs.failOnHigh) {
      this.logger.info(`✅ High severity check passed (${highCount} found, fail-on-high: ${this.inputs.failOnHigh})`);
    }

    if (this.inputs.maxViolations > 0) {
      this.logger.info(`✅ Violation count check passed (${violationCount}/${this.inputs.maxViolations})`);
    }
  }

  /**
   * Generate URL to view scan results in CodeThreat dashboard
   * Matches Azure DevOps format
   */
  private generateScanUrl(scanId: string, repositoryId: string): string {
    const baseUrl = this.inputs.serverUrl.replace('/api', '').replace('api.', 'app.');
    
    // Always use organization-based URL format (consistent with Azure DevOps)
    return `${baseUrl}/${this.inputs.organizationSlug}/scans/${scanId}`;
  }

  /**
   * Get friendly name for violation type
   * Matches Azure DevOps implementation
   */
  private getViolationTypeFriendlyName(type: string): string {
    switch (type.toUpperCase()) {
      case 'SCA':
        return '📦 Dependencies';
      case 'SAST':
      case 'AGENTIC_SAST':
        return '🔒 Security Issues';
      case 'SECRET':
      case 'SECRETS':
        return '🔑 Secrets';
      case 'IAC':
        return '☁️ Infrastructure';
      case 'SBOM':
        return '📋 Software Bill of Materials';
      default:
        return type.substring(0, 1).toUpperCase() + type.substring(1).toLowerCase();
    }
  }
}