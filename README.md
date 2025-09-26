# Aquadistrib Pro Development Setup

This project ships with an Electron + Vite development environment. Because the
application persists data with [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3),
installing dependencies on Windows requires the native build toolchain that
`better-sqlite3` depends on. Without those tools you will see an error similar
to:

```
Error: Cannot find module '...\node_modules\concurrently\dist\bin\concurrently.js'
npm ERR! command failed ... prebuild-install || node-gyp rebuild
npm ERR! gyp ERR! find VS Could not find any Visual Studio installation to use
```

## Prerequisites (Windows)

1. **Install Visual Studio Build Tools**
   - Download the latest Visual Studio Build Tools installer from
     <https://visualstudio.microsoft.com/downloads/>.
   - During installation select the **"Desktop development with C++"** workload.
   - Ensure that at least one **Windows 10/11 SDK** component is selected in the
     "Installation details" pane. The SDK is required so that `node-gyp` can
     compile native modules such as `better-sqlite3`.

2. **Use a supported Node.js version**
   - The published prebuilt binaries for `better-sqlite3` currently cover LTS
     releases. If you are using Node.js 22 (or newer) you may need to downgrade
     to the latest Active LTS (Node.js 20) until official binaries become
     available, or ensure the build tools above are installed so the module can
     compile from source.

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development environment**
   ```bash
   npm run dev
   ```

Following the steps above allows `npm install` to build `better-sqlite3`
successfully, resolving the Visual Studio lookup error during installation.

## Type checking

Run the combined type-checking workflow across the renderer (Vite) and Electron
processes with:

```bash
npm run typecheck
```

This command executes both `npm run typecheck:web` and `npm run typecheck:electron`
to ensure TypeScript coverage for the entire application. Add it to your
continuous integration workflow alongside linting to catch regressions early.

## End-to-end testing

Playwright drives the browser to exercise the renderer. Before running the
suite for the first time install the required browser binaries:

```bash
npx playwright install
```

Execute the end-to-end scenarios with:

```bash
npm run test:e2e
```

To iterate locally with the inspector UI use:

```bash
npm run test:e2e:ui
```
