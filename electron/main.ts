import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { ensureDB, db } from './db.js';

const isDev = !!process.env.VITE_DEV_SERVER_URL;

let win: BrowserWindow | null = null;

async function createWindow() {
  await ensureDB();

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'AquaDistrib Pro',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(process.cwd(), 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/** IPC — Companies */
ipcMain.handle('companies:list', () => {
  return db.prepare('SELECT * FROM companies ORDER BY name').all();
});
ipcMain.handle('companies:create', (_e, payload) => {
  const stmt = db.prepare(
    `INSERT INTO companies (name, type, stores, total_value, status, contact_name, contact_phone, contact_email)
     VALUES (@name,@type,@stores,@total_value,@status,@contact_name,@contact_phone,@contact_email)`
  );
  const info = stmt.run(payload);
  return { id: info.lastInsertRowid };
});
ipcMain.handle('companies:update', (_e, payload) => {
  const stmt = db.prepare(
    `UPDATE companies SET name=@name, type=@type, stores=@stores, total_value=@total_value, status=@status,
     contact_name=@contact_name, contact_phone=@contact_phone, contact_email=@contact_email WHERE id=@id`
  );
  stmt.run(payload);
  return { ok: true };
});
ipcMain.handle('companies:delete', (_e, id: number) => {
  db.prepare('DELETE FROM companies WHERE id=?').run(id);
  return { ok: true };
});

/** IPC — Partners */
ipcMain.handle('partners:list', () => {
  return db.prepare('SELECT * FROM partners ORDER BY name').all();
});
ipcMain.handle('partners:create', (_e, payload) => {
  const stmt = db.prepare(
    `INSERT INTO partners (name, region, cities_json, contact_name, contact_phone, contact_email, status, receipts_status)
     VALUES (@name,@region,@cities_json,@contact_name,@contact_phone,@contact_email,@status,@receipts_status)`
  );
  const info = stmt.run(payload);
  return { id: info.lastInsertRowid };
});
ipcMain.handle('partners:update', (_e, payload) => {
  const stmt = db.prepare(
    `UPDATE partners SET name=@name, region=@region, cities_json=@cities_json, contact_name=@contact_name,
     contact_phone=@contact_phone, contact_email=@contact_email, status=@status, receipts_status=@receipts_status
     WHERE id=@id`
  );
  stmt.run(payload);
  return { ok: true };
});
ipcMain.handle('partners:delete', (_e, id: number) => {
  db.prepare('DELETE FROM partners WHERE id=?').run(id);
  return { ok: true };
});

/** IPC — Kanban (pipeline de comprovantes) */
ipcMain.handle('kanban:list', () => {
  return db.prepare('SELECT * FROM kanban ORDER BY company, stage').all();
});
ipcMain.handle('kanban:upsert', (_e, payload) => {
  const stmt = db.prepare(
    `INSERT INTO kanban (company, stage, receipts, total)
     VALUES (@company,@stage,@receipts,@total)
     ON CONFLICT(company, stage) DO UPDATE SET receipts=@receipts, total=@total`
  );
  stmt.run(payload);
  return { ok: true };
});
