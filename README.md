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
