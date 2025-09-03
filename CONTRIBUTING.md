# Contributing to CodeThreat GitHub Action

Thank you for your interest in contributing to the CodeThreat GitHub Action! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Access to a CodeThreat instance for testing

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CodeThreat/codethreat-appsec-github-action.git
   cd codethreat-appsec-github-action
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the action**:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Test your changes**:
   ```bash
   npm run lint      # Check code style
   npm run test      # Run tests
   npm run build     # Build the action
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### Project Structure

```
src/
├── index.ts              # Main entry point
├── lib/
│   ├── action.ts         # Core action logic
│   ├── inputs.ts         # Input parsing and validation
│   ├── outputs.ts        # Output setting
│   ├── logger.ts         # Logging utilities
│   ├── api-client.ts     # CodeThreat API client
│   └── sarif-uploader.ts # SARIF upload functionality
└── __tests__/
    ├── setup.ts          # Test setup
    └── *.test.ts         # Test files
```

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Use meaningful variable and function names
- Keep functions focused and single-purpose

### Testing

- Write tests for new functionality
- Update tests when modifying existing code
- Ensure all tests pass before submitting PR
- Aim for good test coverage

```bash
npm run test              # Run all tests
npm run test -- --watch  # Run tests in watch mode
npm run test -- --coverage # Generate coverage report
```

## GitHub Action Development

### Key Concepts

1. **Inputs**: Defined in `action.yml` and parsed in `src/lib/inputs.ts`
2. **Outputs**: Set in `src/lib/outputs.ts` and defined in `action.yml`
3. **Logging**: Use the Logger class for consistent output
4. **Error Handling**: Always provide meaningful error messages

### Building and Testing

1. **Build the action**:
   ```bash
   npm run build
   ```
   This creates `dist/index.js` which is the actual action entry point.

2. **Test locally** (if possible):
   ```bash
   # Set required environment variables
   export INPUT_API_KEY="your-test-key"
   export GITHUB_REPOSITORY="owner/repo"
   export GITHUB_REF="refs/heads/main"
   
   # Run the action
   node dist/index.js
   ```

3. **Test in GitHub**:
   - Create a test repository
   - Add the action as a workflow
   - Test with real CodeThreat credentials

### Release Process

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with changes
3. **Build and commit** the updated `dist/` files:
   ```bash
   npm run build
   git add dist/
   git commit -m "chore: update built action"
   ```
4. **Create a release** with appropriate tags

## API Integration

### CodeThreat API

The action communicates with CodeThreat via REST API endpoints:

- `POST /api/v1/repositories/import` - Import repository
- `POST /api/v1/scans/run` - Execute scan
- `GET /api/v1/scans/{id}/results` - Export results
- `GET /api/v1/cli/auth/validate` - Validate authentication

### Error Handling

- Always provide user-friendly error messages
- Log detailed error information in debug mode
- Handle network timeouts and API failures gracefully
- Don't expose sensitive information in error messages

## Testing Guidelines

### Unit Tests

- Test input parsing and validation
- Test API client functionality (with mocks)
- Test error handling scenarios
- Test output generation

### Integration Tests

- Test with real CodeThreat API (in CI)
- Test SARIF upload functionality
- Test various input combinations
- Test failure scenarios

### Example Test

```typescript
describe('ActionInputs', () => {
  it('should parse valid inputs correctly', () => {
    // Mock core.getInput
    (core.getInput as jest.Mock)
      .mockReturnValueOnce('test-api-key')
      .mockReturnValueOnce('sast,sca');

    const inputs = parseInputs();
    
    expect(inputs.apiKey).toBe('test-api-key');
    expect(inputs.scanTypes).toEqual(['sast', 'sca']);
  });
});
```

## Common Issues

### "Action not found"

- Ensure `action.yml` is in the root directory
- Check that `runs.main` points to the correct file
- Verify the action repository is public or accessible

### "Module not found"

- Run `npm run build` to create the bundled `dist/index.js`
- Ensure all dependencies are listed in `package.json`
- Check that imports use correct paths

### "API errors in testing"

- Use test API keys and test servers when possible
- Mock API responses for unit tests
- Handle authentication errors gracefully

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the existing style
- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated if needed
- [ ] `dist/` files are committed if code changed

### PR Description

Include:
- Description of changes made
- Reasoning for the changes
- Any breaking changes
- Testing performed
- Screenshots (if UI changes)

### Review Process

1. Automated checks must pass
2. Code review by maintainers
3. Testing in real GitHub Action environment
4. Approval and merge

## Getting Help

- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)
- 📖 [CodeThreat Documentation](https://docs.codethreat.com)
- 💬 [Discord Community](https://discord.gg/codethreat)
- 🐛 [Report Issues](https://github.com/CodeThreat/codethreat-appsec-github-action/issues)

Thank you for contributing to CodeThreat! 🚀
