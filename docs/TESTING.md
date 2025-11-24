# Testing Guide

Comprehensive testing setup for the Sprite Sheet Manager application with VS Code integration.

## Testing Stack

### Frontend Testing

- **Vitest**: Fast unit test runner with hot reload
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Custom Jest matchers for DOM testing
- **User Event**: Realistic user interaction simulation

### Backend Testing

- **Jest**: Node.js testing framework
- **Supertest**: HTTP assertion library
- **Coverage**: Built-in code coverage reporting

```bash
cd client
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Open Vitest UI dashboard
npm run test:coverage # Generate coverage report
```

### Backend Tests run

```bash
cd server
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### VS Code Integration

#### Test Discovery

- Tests are automatically discovered in VS Code
- Use Test Explorer panel to view and run tests
- File nesting shows test files next to source files

#### Running Tests

- **Command Palette**: `Tasks: Run Task` → Select test task
- **Test Explorer**: Click run buttons next to tests
- **Keyboard Shortcuts**: Use VS Code test shortcuts

#### Debugging Tests

- Set breakpoints in test files
- Use Debug Console: `Debug Frontend Tests` or `Debug Backend Tests`
- Debug specific files: `Debug Current Test File`

## Test Structure

### Frontend Tests

```
client/src/test/
├── setup.ts                    # Test environment setup
├── components/
│   └── Layout.test.tsx         # Layout component tests
└── pages/
    ├── Dashboard.test.tsx      # Dashboard page tests
    ├── SpriteEditor.test.tsx   # Sprite editor tests
    └── ColorPalette.test.tsx   # Color palette tests
```

### Backend Tests

```
server/test/
├── setup.js                   # Jest test setup
└── routes/
    ├── sprites.test.js         # Sprite API tests
    └── colors.test.js          # Color API tests
```

## Test Categories

### Unit Tests

- Component rendering and behavior
- Service class functionality
- API endpoint validation
- Parameter handling

### Integration Tests

- API route testing with Supertest
- Component interaction testing
- File upload simulation
- Error handling validation

### Coverage Goals

- **Frontend**: 80%+ component coverage
- **Backend**: 80%+ route and service coverage
- **Critical Paths**: 95%+ coverage for core features

## VS Code Features

### Test Explorer

- Hierarchical test view
- Run/debug individual tests
- Test status indicators
- Coverage visualization

### Tasks Integration

- `Frontend Tests` - Run Vitest suite
- `Backend Tests` - Run Jest suite
- `All Tests` - Run both suites in parallel
- Coverage tasks for detailed reports

### Debug Configuration

- Step-through debugging for test failures
- Environment variable configuration
- Source map support for TypeScript

## Writing Tests

### Frontend Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Component from '@/components/Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Backend Test Example

```javascript
const request = require('supertest')
const app = require('../app')

describe('GET /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200)
    
    expect(response.body).toHaveProperty('success', true)
  })
})
```

## Coverage Reports

### Viewing Coverage

- Frontend: `client/coverage/index.html`
- Backend: `server/coverage/index.html`
- VS Code: Coverage gutters show line coverage

### Coverage Thresholds

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Best Practices

### Test Organization

- Group related tests with `describe` blocks
- Use descriptive test names with `it` statements
- Follow AAA pattern: Arrange, Act, Assert

### Mocking

- Mock external dependencies
- Use realistic test data
- Isolate units under test

### Assertions

- Test behavior, not implementation
- Use semantic queries in React Testing Library
- Assert on user-visible outcomes

## Continuous Integration

### GitHub Actions (Future)

```yaml
- name: Frontend Tests
  run: cd client && npm run test:run

- name: Backend Tests
  run: cd server && npm run test

- name: Coverage Upload
  uses: codecov/codecov-action@v1
```

### Pre-commit Hooks

- Run tests before commits
- Ensure coverage thresholds met
- Lint and format code

This testing setup provides comprehensive coverage with excellent VS Code integration for a professional development workflow.
