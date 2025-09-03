// Jest setup file
import * as core from '@actions/core';

// Mock GitHub Actions core functions for testing
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  getBooleanInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  startGroup: jest.fn(),
  endGroup: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
    ref: 'refs/heads/main',
    sha: 'abc123',
    workflow: 'test-workflow',
    job: 'test-job',
    runId: 123,
    runNumber: 456,
    actor: 'test-actor',
    eventName: 'push',
  },
  getOctokit: jest.fn(),
}));
