# System Patterns

Documents patterns, best practices, and standards shared across modes.

## Coding Patterns

2025-11-23 15:50:53 - TypeScript Strict Mode: All files use strict TypeScript configuration
2025-11-23 15:50:53 - Component Architecture: Functional React components with hooks
2025-11-23 15:50:53 - Service Layer: Business logic encapsulated in service classes
2025-11-23 15:50:53 - Error Handling: Comprehensive try-catch blocks with proper error propagation
2025-11-23 15:50:53 - File Organization: Clear separation of concerns (components, pages, services, routes)

## Architectural Patterns

2025-11-23 15:50:53 - Clean Architecture: Frontend/backend separation with REST API communication
2025-11-23 15:50:53 - Repository Pattern: Service classes handle data operations and business logic
2025-11-23 15:50:53 - Component Composition: Material-UI components with custom theming
2025-11-23 15:50:53 - Path Alias System: "@/" aliases for clean import statements
2025-11-23 15:50:53 - Environment Configuration: .env files for configuration management

## Testing Patterns

2025-11-23 15:50:53 - Development Setup: Hot reload with Vite for fast development cycles
2025-11-23 15:50:53 - Cross-platform Support: Both Windows (.bat) and Unix (.sh) launcher scripts
2025-11-23 15:50:53 - Dependency Management: Separate package.json files for client/server isolation
2025-11-23 15:50:53 - Error Boundaries: Comprehensive error handling in UI and API layers
2025-11-23 15:50:53 - Memory Management: Proper cleanup of temporary files and object URLs

## UI/UX Patterns

2025-11-24 20:56:00 - Darcula Color Scheme: All UI components must follow Material-UI's dark theme with proper usage of theme.palette colors. Never use hardcoded colors like bright greens (#4caf50) or pure blacks/whites. Always use theme-aware colors:
  - Backgrounds: theme.palette.background.paper, theme.palette.background.default
  - Text: theme.palette.text.primary, theme.palette.text.secondary
  - Borders: theme.palette.divider
  - Interactive elements: theme.palette.action.hover, theme.palette.action.selected
  - Status colors: theme.palette.success.main, theme.palette.error.main, theme.palette.primary.main
  - This ensures consistent dark mode appearance and proper theme responsiveness

## Operational Rules

2025-11-23 17:36:00 - Application Execution: The user runs the application. Assistant should NOT execute commands to start/launch the app (e.g., npm run dev, npm start). The user manages application lifecycle independently.
