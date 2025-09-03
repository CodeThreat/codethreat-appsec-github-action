# Changelog

All notable changes to the CodeThreat GitHub Action will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added

#### Core Functionality
- **Security Scanning**: Comprehensive SAST, SCA, Secrets, and IaC analysis
- **GitHub Integration**: Automatic SARIF upload to GitHub Security tab
- **Synchronous Execution**: Real-time scan execution with progress monitoring
- **Multiple Output Formats**: Support for SARIF, JSON, XML, CSV, and JUnit formats

#### Action Features
- **Flexible Configuration**: 20+ input parameters for customization
- **Build Protection**: Configurable failure conditions (critical, high, max violations)
- **Repository Management**: Automatic repository import and detection
- **Comprehensive Logging**: Structured logging with debug mode support

#### CI/CD Integration
- **GitHub Security Tab**: Automatic SARIF upload and vulnerability display
- **Workflow Integration**: Seamless integration with existing GitHub workflows
- **Output Variables**: Rich set of outputs for downstream workflow steps
- **Error Handling**: Graceful error handling with actionable error messages

#### Developer Experience
- **TypeScript**: Fully typed codebase for better development experience
- **Modular Design**: Clean separation of concerns with dedicated modules
- **Comprehensive Documentation**: Detailed README with examples
- **Professional Testing**: Jest test suite with CI/CD validation

### Technical Details

#### Architecture
- **Modular Design**: Separate modules for inputs, outputs, API client, and SARIF upload
- **Error Boundaries**: Comprehensive error handling at each step
- **GitHub Actions Best Practices**: Follows official GitHub Actions guidelines
- **Security First**: Secure handling of API keys and sensitive data

#### API Integration
- **CodeThreat API Client**: Robust HTTP client with retry logic and error handling
- **Authentication**: Secure API key authentication with validation
- **Real-time Monitoring**: Polling-based scan status monitoring
- **Result Processing**: Multi-format result export and processing

#### GitHub Integration
- **SARIF 2.1.0**: Full compliance with SARIF specification
- **Code Scanning API**: Integration with GitHub's Code Scanning API
- **Security Tab**: Automatic vulnerability display in GitHub UI
- **Permissions**: Proper permission handling for security events

### Dependencies

#### Production Dependencies
- `@actions/core`: ^1.10.1 - GitHub Actions core functionality
- `@actions/github`: ^6.0.0 - GitHub API integration
- `@actions/exec`: ^1.1.1 - Command execution utilities
- `@actions/tool-cache`: ^2.0.1 - Tool caching functionality
- `axios`: ^1.6.2 - HTTP client for API communication
- `fs-extra`: ^11.2.0 - Enhanced file system operations

#### Development Dependencies
- `@vercel/ncc`: ^0.38.1 - Action bundling and compilation
- `typescript`: ^5.3.3 - TypeScript compiler
- `eslint`: ^8.55.0 - Code linting
- `jest`: ^29.7.0 - Testing framework

### Breaking Changes
- None (initial release)

### Migration Guide
- None (initial release)

---

## Release Notes Template

When releasing new versions, use this template:

### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features and capabilities

#### Changed
- Changes to existing functionality

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Features that have been removed

#### Fixed
- Bug fixes and corrections

#### Security
- Security-related changes and fixes
