# CodeThreat GitHub Action

A GitHub Action for integrating CodeThreat security scanning into your CI/CD workflows. This action uses the **CodeThreat CLI as a dependency**, ensuring consistent behavior, faster execution, and better security. Results are automatically uploaded to GitHub's Security tab.

## Features

- 🚀 **Dependency-Based Architecture**: CLI imported as npm package (no external installation)
- 🔍 **Comprehensive Security Scanning**: SAST, SCA, Secrets, and IaC analysis
- 🤖 **AI-Powered Analysis**: False positive elimination and intelligent insights
- 📊 **GitHub Integration**: Automatic SARIF upload to GitHub Security tab
- ⚡ **Fast & Secure**: No network calls for CLI installation, always uses latest version
- 🛡️ **Build Protection**: Configurable failure conditions for CI/CD
- 📈 **Detailed Reporting**: Multiple output formats (SARIF, JSON, XML, CSV)

## Quick Start

Add this action to your workflow:

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    permissions:
      security-events: write  # Required for SARIF upload
      contents: read
      actions: read
    
    steps:
      - uses: actions/checkout@v4
      
      - name: CodeThreat Security Scan
        uses: CodeThreat/codethreat-appsec-github-action@v1
        with:
          # Required
          api-key: ${{ secrets.CODETHREAT_API_KEY }}
          server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
          organization-slug: ${{ secrets.CODETHREAT_ORG_SLUG }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          
          # Optional
          upload-sarif: true
          wait-for-completion: true
```

## Inputs

### Required

| Input | Description | Example |
|-------|-------------|---------|
| `api-key` | CodeThreat API key | `${{ secrets.CODETHREAT_API_KEY }}` |
| `server-url` | CodeThreat server URL | `${{ secrets.CODETHREAT_SERVER_URL }}` |
| `organization-slug` | Organization slug (from org settings) | `${{ secrets.CODETHREAT_ORG_SLUG }}` |

### Optional

| Input | Description | Default | Example |
|-------|-------------|---------|---------|
| `repository-url` | Repository URL to scan | Current repository | `https://github.com/user/repo.git` |
| `branch` | Branch to scan | Current branch | `main` |
| `wait-for-completion` | Wait for scan completion | `true` | `false` |
| `timeout` | Scan timeout in seconds | `43200` (12 hours) | `7200` (2 hours) |
| `poll-interval` | Status polling interval (seconds) | `30` | `60` |
| `output-format` | Output format | `sarif` | `json`, `csv`, `xml`, `junit` |
| `output-file` | Output file name | `codethreat-results.sarif` | `security-report.json` |
| `upload-sarif` | Upload SARIF to GitHub Security | `true` | `false` |
| `fail-on-critical` | Fail on critical vulnerabilities | `false` | `true` |
| `fail-on-high` | Fail on high severity vulnerabilities | `false` | `true` |
| `max-violations` | Max violations before failing | `0` (no limit) | `50` |

> **Note:** By default, builds will not fail based on vulnerabilities. Set `fail-on-critical: true` or `fail-on-high: true` to enforce security gates in your CI/CD pipeline.
| `skip-import` | Skip import if repo exists | `true` | `false` |
| `verbose` | Enable verbose logging | `false` | `true` |

> **Note:** Scan types (SAST, SCA, Secrets, IaC) are automatically determined by your organization's configuration in CodeThreat. This ensures consistency across all CI/CD platforms.

## Outputs

| Output | Description |
|--------|-------------|
| `scan-id` | ID of the completed scan |
| `repository-id` | ID of the imported repository |
| `results-file` | Path to the results file |
| `violation-count` | Total number of violations |
| `critical-count` | Number of critical violations |
| `high-count` | Number of high severity violations |
| `medium-count` | Number of medium severity violations |
| `low-count` | Number of low severity violations |
| `security-score` | Security score (0-100) |
| `scan-duration` | Scan duration in seconds |
| `scan-url` | URL to view results in CodeThreat dashboard |

## Usage Examples

### Basic Security Scan

```yaml
- name: CodeThreat Security Scan
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    # Required
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    
    # Optional
    scan-types: 'sast,sca,secrets'
```

### Advanced Configuration

```yaml
- name: CodeThreat Security Scan
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    # Required
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    
    # Scan Configuration
    scan-types: 'sast,sca,secrets,iac'
    fail-on-critical: true
    fail-on-high: true
    max-violations: 10
    timeout: 45
    
    # Output Configuration
    upload-sarif: true
    output-format: 'sarif'
    verbose: true
```

### Multiple Output Formats

```yaml
- name: CodeThreat Security Scan
  id: codethreat
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    # Required
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    
    # Output Configuration
    output-format: 'json'
    output-file: 'security-report.json'
    upload-sarif: false

- name: Upload Custom Report
  uses: actions/upload-artifact@v4
  with:
    name: security-report
    path: security-report.json
```

### Conditional Scanning

```yaml
- name: CodeThreat Security Scan
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    scan-types: 'sast,sca,secrets,iac'
    fail-on-critical: true
    fail-on-high: true
```

### Using Outputs

```yaml
- name: CodeThreat Security Scan
  id: security-scan
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    # Required
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const { data: comments } = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
      });
      
      const scanResults = `
      ## 🛡️ CodeThreat Security Scan Results
      
      - **Violations Found**: ${{ steps.security-scan.outputs.violation-count }}
      - **Critical**: ${{ steps.security-scan.outputs.critical-count }}
      - **High**: ${{ steps.security-scan.outputs.high-count }}
      - **Security Score**: ${{ steps.security-scan.outputs.security-score }}/100
      
      [View Detailed Results](${{ steps.security-scan.outputs.scan-url }})
      `;
      
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: scanResults
      });
```

## Setup

### 1. Get CodeThreat API Key

1. Sign up at [CodeThreat](https://app.codethreat.com)
2. Go to Organization Settings → API Keys
3. Create a new API key with appropriate scopes
4. Copy the API key

### 2. Add GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CODETHREAT_API_KEY` | `ctk_xxx...` | Your CodeThreat API key |
| `CODETHREAT_SERVER_URL` | `https://app.codethreat.com` | Server URL (optional) |

### 3. Enable GitHub Advanced Security (if needed)

For SARIF upload to work, you need:
- **Public repositories**: GitHub Advanced Security is free
- **Private repositories**: Requires GitHub Advanced Security license

## Workflow Examples

### Complete CI/CD Workflow

```yaml
name: Security and Quality
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    permissions:
      security-events: write  # Required for SARIF upload
      contents: read
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      
      - name: CodeThreat Security Scan
        uses: CodeThreat/codethreat-appsec-github-action@v1
        with:
          # Required
          api-key: ${{ secrets.CODETHREAT_API_KEY }}
          server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          
          # Configuration
          scan-types: 'sast,sca,secrets'
          fail-on-critical: true
          timeout: 30
          verbose: ${{ runner.debug == '1' }}
```

### Multi-Environment Workflow

```yaml
name: Multi-Environment Security
on: [push, pull_request]

jobs:
  security-dev:
    if: github.ref != 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: CodeThreat/codethreat-appsec-github-action@v1
        with:
          api-key: ${{ secrets.CODETHREAT_DEV_API_KEY }}
          server-url: ${{ secrets.CODETHREAT_DEV_URL }}
          fail-on-critical: false  # More lenient for development

  security-prod:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: CodeThreat/codethreat-appsec-github-action@v1
        with:
          api-key: ${{ secrets.CODETHREAT_PROD_API_KEY }}
          scan-types: 'sast,sca,secrets,iac'
          fail-on-critical: true
          fail-on-high: true
          max-violations: 0  # Zero tolerance for production
```

## Troubleshooting

### Common Issues

**"Authentication failed"**
- Check that `CODETHREAT_API_KEY` secret is set correctly
- Verify API key has not expired
- Ensure API key has required scopes

**"SARIF upload failed"**
- Enable GitHub Advanced Security for private repositories
- Check that workflow has `security-events: write` permission
- Verify repository settings allow security uploads

**"Scan timeout"**
- Increase `timeout` value for large repositories
- Check CodeThreat server status
- Consider running scan asynchronously with `wait-for-completion: false`

### Debug Mode

Enable debug logging by adding to your workflow:

```yaml
- name: CodeThreat Security Scan
  uses: CodeThreat/codethreat-appsec-github-action@v1
  with:
    # Required
    api-key: ${{ secrets.CODETHREAT_API_KEY }}
    server-url: ${{ secrets.CODETHREAT_SERVER_URL }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    
    # Enable verbose logging
    verbose: true
```

Or enable runner debug mode:
- Go to Actions → Re-run jobs → Enable debug logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.codethreat.com)
- 💬 [Discord Community](https://discord.gg/codethreat)
- 📧 [Support Email](mailto:support@codethreat.com)
- 🐛 [Report Issues](https://github.com/CodeThreat/codethreat-appsec-github-action/issues)
