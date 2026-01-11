# CLAUDE.md - AI Assistant Guidelines for Roundtable

This document provides guidance for AI assistants (like Claude) working on the Roundtable civic project.

## Project Overview

**Roundtable** is a civic project aimed at facilitating community engagement and democratic participation. The project is in early-stage development.

### Project Status

- **Stage**: Initial Development
- **Repository**: Fresh initialization
- **Primary Branch**: `main` (or as specified in git configuration)

## Repository Structure

```
roundtable/
├── README.md          # Project description
├── CLAUDE.md          # This file - AI assistant guidelines
└── (future directories will be documented as added)
```

### Planned Structure (to be updated as project evolves)

```
roundtable/
├── src/               # Source code
│   ├── components/    # UI components (if frontend)
│   ├── services/      # Business logic / services
│   ├── utils/         # Utility functions
│   └── types/         # Type definitions
├── tests/             # Test files
├── docs/              # Documentation
├── scripts/           # Build and utility scripts
└── config/            # Configuration files
```

## Development Guidelines

### Getting Started

Since this is an early-stage project, initial setup steps will be documented here as the technology stack is established.

### Code Style Conventions

Follow these conventions as the codebase grows:

1. **Naming Conventions**
   - Use descriptive, meaningful names
   - Variables and functions: `camelCase`
   - Classes and components: `PascalCase`
   - Constants: `SCREAMING_SNAKE_CASE`
   - Files: Match the export name (e.g., `UserProfile.tsx` for `UserProfile` component)

2. **Code Organization**
   - Keep files focused and single-purpose
   - Prefer composition over inheritance
   - Extract reusable logic into utility functions

3. **Comments and Documentation**
   - Write self-documenting code where possible
   - Add comments for complex business logic
   - Document public APIs and interfaces

### Git Workflow

1. **Branch Naming**
   - Feature branches: `feature/<description>`
   - Bug fixes: `fix/<description>`
   - Claude sessions: `claude/<session-id>`

2. **Commit Messages**
   - Use present tense: "Add feature" not "Added feature"
   - Be concise but descriptive
   - Reference issues when applicable: "Fix login bug (#123)"

3. **Pull Requests**
   - Include clear description of changes
   - Reference related issues
   - Ensure tests pass before requesting review

## AI Assistant Best Practices

When working on this project, AI assistants should:

### Before Making Changes

1. **Understand Context**: Read relevant files before suggesting modifications
2. **Check Existing Patterns**: Look for established patterns in the codebase
3. **Verify Requirements**: Ensure understanding of what's being requested

### While Making Changes

1. **Keep Changes Focused**: Make only the changes requested
2. **Avoid Over-Engineering**: Simple solutions are preferred
3. **Follow Existing Conventions**: Match the style of surrounding code
4. **Security First**: Never introduce vulnerabilities (XSS, SQL injection, etc.)
5. **Test Considerations**: Consider how changes can be tested

### After Making Changes

1. **Verify Changes Work**: Run tests and builds when available
2. **Commit Appropriately**: Use clear, descriptive commit messages
3. **Document Significant Changes**: Update documentation as needed

## Testing

Testing framework and conventions will be documented here once established.

### Expected Testing Practices

- Write unit tests for utility functions
- Write integration tests for services
- Write end-to-end tests for critical user flows
- Maintain reasonable test coverage

## Building and Running

Build commands and development server instructions will be documented here once the technology stack is established.

### Common Commands (placeholder)

```bash
# Install dependencies
# npm install (or yarn/pnpm)

# Run development server
# npm run dev

# Run tests
# npm test

# Build for production
# npm run build
```

## Environment Configuration

Environment variables and configuration will be documented here as the project develops.

### Expected Environment Files

- `.env.local` - Local development overrides (not committed)
- `.env.example` - Template for environment variables (committed)

## Civic Project Considerations

As a civic project, special attention should be paid to:

1. **Accessibility**: Ensure features are accessible to all users
2. **Inclusivity**: Design for diverse communities
3. **Privacy**: Handle user data responsibly
4. **Transparency**: Keep processes open and understandable
5. **Security**: Protect user information and system integrity

## Troubleshooting

Common issues and solutions will be documented here as they are discovered.

## Contributing

Contribution guidelines will be established as the project matures.

### Current Contribution Process

1. Create a feature branch from main
2. Make your changes following the guidelines above
3. Test your changes
4. Submit a pull request with a clear description

---

*This document should be updated as the project evolves. When new patterns, technologies, or conventions are established, add them here to help future contributors and AI assistants work effectively on this codebase.*
