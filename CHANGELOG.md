# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows semantic versioning where practical.

## [0.1.0-beta] - 2026-02-09

### Added

- Onboarding wizard with Ollama status checks and retry
- Knowledge base pruning and stale detection tools
- Unit tests and fixtures for KnowledgeProcessor
- KB cleanup controls in the settings panel

### Changed

- IPC handlers for KB maintenance and Ollama status

### Fixed

- Onboarding entry compatibility with React 18 without `react-dom/client`
