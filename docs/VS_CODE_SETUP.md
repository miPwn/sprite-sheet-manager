# VS Code Test Setup Guide

## Test Discovery Troubleshooting

### Step 1: Install Required Extensions

Install these extensions from the VS Code Marketplace:

1. **Vitest Extension**
   - Extension ID: `vitest.explorer`
   - Or search "Vitest" in Extensions panel

2. **Jest Extension**
   - Extension ID: `ms-vscode.vscode-jest`
   - Or search "Jest" in Extensions panel

3. **Test Explorer UI**
   - Extension ID: `hbenl.vscode-test-explorer`
   - Or search "Test Explorer UI"

### Step 2: Open Workspace Properly

1. **Close current VS Code window**
2. **File → Open Workspace from File**
3. **Select**: `sprite-sheet-manager.code-workspace`
4. **Reload VS Code** when prompted

### Step 3: Enable Test Explorer

1. **View → Test Explorer** (or `Ctrl+Shift+T`)
2. **Wait for extension activation** (may take 30 seconds)
3. **Tests should appear** in Test Explorer panel

### Step 4: Alternative Test Running

If Test Explorer doesn't work:

**Command Palette Method:**

1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select test tasks:
   - "Frontend Tests" (Vitest)
   - "Backend Tests" (Jest)
   - "All Tests" (Both)

**Manual Terminal Method:**

```bash
# Frontend tests
cd client
npm run test

# Backend tests  
cd server
npm run test

# Test with UI
cd client
npm run test:ui
```

### Step 5: Debug Tests

**Debug Frontend Tests:**

1. **F5** or **Run → Start Debugging**
2. Select "Debug Frontend Tests"
3. Set breakpoints in test files

**Debug Backend Tests:**

1. **F5** or **Run → Start Debugging**
2. Select "Debug Backend Tests"
3. Set breakpoints in test files

### Verification Steps

**Check if tests are discoverable:**

1. Look for test files in Explorer with nested view
2. Check Test Explorer panel for test tree
3. Verify test runner status in status bar

**Common Issues:**

1. **Extensions not installed**
   - Install recommended extensions
   - Reload VS Code after installation

2. **Wrong workspace**
   - Use `.code-workspace` file, not folder
   - Ensure multi-folder workspace setup

3. **TypeScript errors**
   - Fix any TypeScript compilation errors
   - Tests won't discover if code doesn't compile

4. **Missing dependencies**
   - Run `npm install` in both client and server directories

### Manual Test Discovery

If automatic discovery fails, manually run:

```bash
# From project root
cd client && npm run test:run
cd server && npm run test
```

This will validate that tests work even if VS Code discovery is having issues.

## File Locations

**Frontend Tests:**

- `client/src/test/components/Layout.test.tsx`
- `client/src/test/pages/Dashboard.test.tsx`
- `client/src/test/pages/SpriteEditor.test.tsx`
- `client/src/test/pages/ColorPalette.test.tsx`

**Backend Tests:**

- `server/test/routes/sprites.test.js`
- `server/test/routes/colors.test.js`

**Configuration:**

- Frontend: `client/vitest.config.ts`
- Backend: `server/jest.config.js`
- VS Code: `.vscode/settings.json`, `.vscode/tasks.json`, `.vscode/launch.json`
