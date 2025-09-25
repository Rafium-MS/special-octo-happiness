import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { ensureDB, db } from './db.js';

type CompanyPayload = {
  id?: number;
  name: string;
  type: string;
  stores: number;
  total_value: number;
  status: Status;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
};

type PartnerPayload = {
  id?: number;
  name: string;
  region: string;
  cities_json: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: Status;
  receipts_status: ReceiptStatus;
};

type KanbanPayload = {
  company: string;
  stage: ReceiptStage;
  receipts: number;
  total: number;
};

type Status = 'ativo' | 'inativo';
type ReceiptStatus = 'enviado' | 'pendente';
type ReceiptStage = 'recebimento' | 'relatorio' | 'nota_fiscal';

const STATUSES: ReadonlySet<Status> = new Set(['ativo', 'inativo']);
const RECEIPT_STATUSES: ReadonlySet<ReceiptStatus> = new Set(['enviado', 'pendente']);
const RECEIPT_STAGES: ReadonlySet<ReceiptStage> = new Set([
  'recebimento',
  'relatorio',
  'nota_fiscal'
]);
const CONTROL_CHARACTERS = new Set(
  [0x00, 0x08, 0x09, 0x1A].map(code => String.fromCharCode(code))
);

function sanitizeText(
  value: unknown,
  field: string,
  options: { required?: boolean; maxLength?: number; sanitizeQuotes?: boolean } = {}
) {
  const { required = false, maxLength = 255, sanitizeQuotes = true } = options;
  if (typeof value !== 'string') {
    throw new TypeError(`${field} deve ser uma string.`);
  }

  const controlSanitized = Array.from(value, char =>
    CONTROL_CHARACTERS.has(char) ? ' ' : char
  ).join('');

  let sanitized = controlSanitized
    .replace(/\r?\n|\r/g, ' ')
    .replace(/--/g, '—')
    .replace(/;/g, ',')
    .replaceAll('/*', ' ')
    .replaceAll('*/', ' ')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (sanitizeQuotes) {
    sanitized = sanitized.replace(/'/g, '’').replace(/"/g, '”');
  } else if (/["']/u.test(sanitized)) {
    throw new TypeError(`${field} contém caracteres não permitidos.`);
  }

  if (sanitized.length > maxLength) {
    throw new TypeError(`${field} excede o tamanho máximo permitido de ${maxLength} caracteres.`);
  }

  if (required && sanitized.length === 0) {
    throw new TypeError(`${field} é obrigatório.`);
  }

  return sanitized;
}

function sanitizeEmail(value: unknown, field: string) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(`${field} deve ser uma string.`);
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed === '') {
    return '';
  }

  if (/[,;\\]/.test(trimmed) || /--/.test(trimmed)) {
    throw new TypeError(`${field} contém caracteres não permitidos.`);
  }

  const emailPattern =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*$/i;
  if (!emailPattern.test(trimmed)) {
    throw new TypeError(`${field} possui um formato inválido.`);
  }

  return trimmed;
}

function ensureNumber(value: unknown, field: string, options: { integer?: boolean; min?: number } = {}) {
  const { integer = false, min } = options;

  if (value === undefined || value === null) {
    throw new TypeError(`${field} é obrigatório.`);
  }

  let parsed: number;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string') {
    const sanitized = sanitizeText(value, field, { required: true, maxLength: 64 });
    const normalized = sanitized.replace(/,/g, '.');
    parsed = Number(normalized);
  } else {
    throw new TypeError(`${field} deve ser numérico.`);
  }

  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${field} possui um valor inválido.`);
  }

  if (integer && !Number.isInteger(parsed)) {
    throw new TypeError(`${field} deve ser um número inteiro.`);
  }

  if (typeof min === 'number' && parsed < min) {
    throw new TypeError(`${field} deve ser maior ou igual a ${min}.`);
  }

  return parsed;
}

function ensureStatus(value: unknown, field: string): Status {
  const sanitized = sanitizeText(value, field, { required: true, maxLength: 32 }).toLowerCase() as Status;
  if (!STATUSES.has(sanitized)) {
    throw new TypeError(`${field} possui um valor inválido.`);
  }
  return sanitized;
}

function ensureReceiptStatus(value: unknown, field: string): ReceiptStatus {
  const sanitized = sanitizeText(value, field, { required: true, maxLength: 32 }).toLowerCase() as ReceiptStatus;
  if (!RECEIPT_STATUSES.has(sanitized)) {
    throw new TypeError(`${field} possui um valor inválido.`);
  }
  return sanitized;
}

function ensureStage(value: unknown, field: string): ReceiptStage {
  const sanitized = sanitizeText(value, field, { required: true, maxLength: 32 }).toLowerCase() as ReceiptStage;
  if (!RECEIPT_STAGES.has(sanitized)) {
    throw new TypeError(`${field} possui um valor inválido.`);
  }
  return sanitized;
}

function sanitizeCities(value: unknown, field: string): string {
  let cities: unknown;
  if (typeof value === 'string') {
    try {
      cities = JSON.parse(value);
    } catch (error) {
      throw new TypeError(`${field} deve ser um JSON válido.`);
    }
  } else {
    cities = value;
  }

  if (!Array.isArray(cities)) {
    throw new TypeError(`${field} deve ser uma lista.`);
  }

  const sanitizedCities = cities.map((city, index) =>
    sanitizeText(city, `${field}[${index}]`, { required: true })
  );

  return JSON.stringify(sanitizedCities);
}

function validateCompanyPayload(payload: unknown, { requireId = false } = {}): CompanyPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new TypeError('Payload de empresa inválido.');
  }

  const company: CompanyPayload = {
    name: sanitizeText((payload as Record<string, unknown>).name, 'name', { required: true }),
    type: sanitizeText((payload as Record<string, unknown>).type ?? '', 'type'),
    stores: ensureNumber((payload as Record<string, unknown>).stores, 'stores', { integer: true, min: 0 }),
    total_value: ensureNumber((payload as Record<string, unknown>).total_value, 'total_value', { min: 0 }),
    status: ensureStatus((payload as Record<string, unknown>).status, 'status'),
    contact_name: sanitizeText((payload as Record<string, unknown>).contact_name ?? '', 'contact_name'),
    contact_phone: sanitizeText((payload as Record<string, unknown>).contact_phone ?? '', 'contact_phone'),
    contact_email: sanitizeEmail((payload as Record<string, unknown>).contact_email, 'contact_email')
  };

  if (requireId) {
    company.id = ensureNumber((payload as Record<string, unknown>).id, 'id', {
      integer: true,
      min: 1
    });
  }

  return company;
}

function validatePartnerPayload(payload: unknown, { requireId = false } = {}): PartnerPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new TypeError('Payload de parceiro inválido.');
  }

  const partner: PartnerPayload = {
    name: sanitizeText((payload as Record<string, unknown>).name, 'name', { required: true }),
    region: sanitizeText((payload as Record<string, unknown>).region, 'region', { required: true }),
    cities_json: sanitizeCities((payload as Record<string, unknown>).cities_json, 'cities_json'),
    contact_name: sanitizeText((payload as Record<string, unknown>).contact_name ?? '', 'contact_name'),
    contact_phone: sanitizeText((payload as Record<string, unknown>).contact_phone ?? '', 'contact_phone'),
    contact_email: sanitizeEmail((payload as Record<string, unknown>).contact_email, 'contact_email'),
    status: ensureStatus((payload as Record<string, unknown>).status, 'status'),
    receipts_status: ensureReceiptStatus(
      (payload as Record<string, unknown>).receipts_status,
      'receipts_status'
    )
  };

  if (requireId) {
    partner.id = ensureNumber((payload as Record<string, unknown>).id, 'id', { integer: true, min: 1 });
  }

  return partner;
}

function validateKanbanPayload(payload: unknown): KanbanPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new TypeError('Payload do kanban inválido.');
  }

  return {
    company: sanitizeText((payload as Record<string, unknown>).company, 'company', { required: true }),
    stage: ensureStage((payload as Record<string, unknown>).stage, 'stage'),
    receipts: ensureNumber((payload as Record<string, unknown>).receipts, 'receipts', {
      integer: true,
      min: 0
    }),
    total: ensureNumber((payload as Record<string, unknown>).total, 'total', {
      integer: true,
      min: 0
    })
  };
}

const isDev = !!process.env.VITE_DEV_SERVER_URL;

let win: BrowserWindow | null = null;
let devCspInstalled = false;

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

  if (isDev && win && !devCspInstalled) {
    const { session } = win.webContents;
    session.webRequest.onHeadersReceived(
      { urls: ['http://localhost:5173/*'] },
      (details, callback) => {
        const csp = [
          "default-src 'self' http://localhost:5173 ws://localhost:5173 data: blob:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173",
          "style-src 'self' 'unsafe-inline' http://localhost:5173",
          "img-src 'self' data: blob: http://localhost:5173",
          "font-src 'self' data: http://localhost:5173",
          "connect-src 'self' ws://localhost:5173 http://localhost:5173"
        ].join('; ');

        const responseHeaders = { ...(details.responseHeaders ?? {}) } as Record<string, string[]>;
        delete responseHeaders['Content-Security-Policy'];
        delete responseHeaders['content-security-policy'];
        responseHeaders['Content-Security-Policy'] = [csp];

        callback({ responseHeaders });
      }
    );
    devCspInstalled = true;
  }

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
  const company = validateCompanyPayload(payload);
  const stmt = db.prepare(
    `INSERT INTO companies (name, type, stores, total_value, status, contact_name, contact_phone, contact_email)
     VALUES (@name,@type,@stores,@total_value,@status,@contact_name,@contact_phone,@contact_email)`
  );
  const info = stmt.run(company);
  return { id: Number(info.lastInsertRowid) };
});
ipcMain.handle('companies:update', (_e, payload) => {
  const company = validateCompanyPayload(payload, { requireId: true });
  const stmt = db.prepare(
    `UPDATE companies SET name=@name, type=@type, stores=@stores, total_value=@total_value, status=@status,
     contact_name=@contact_name, contact_phone=@contact_phone, contact_email=@contact_email WHERE id=@id`
  );
  stmt.run(company);
  return { ok: true };
});
ipcMain.handle('companies:delete', (_e, rawId: number) => {
  const id = ensureNumber(rawId, 'id', { integer: true, min: 1 });
  db.prepare('DELETE FROM companies WHERE id=?').run(id);
  return { ok: true };
});

/** IPC — Partners */
ipcMain.handle('partners:list', () => {
  return db.prepare('SELECT * FROM partners ORDER BY name').all();
});
ipcMain.handle('partners:create', (_e, payload) => {
  const partner = validatePartnerPayload(payload);
  const stmt = db.prepare(
    `INSERT INTO partners (name, region, cities_json, contact_name, contact_phone, contact_email, status, receipts_status)
     VALUES (@name,@region,@cities_json,@contact_name,@contact_phone,@contact_email,@status,@receipts_status)`
  );
  const info = stmt.run(partner);
  return { id: Number(info.lastInsertRowid) };
});
ipcMain.handle('partners:update', (_e, payload) => {
  const partner = validatePartnerPayload(payload, { requireId: true });
  const stmt = db.prepare(
    `UPDATE partners SET name=@name, region=@region, cities_json=@cities_json, contact_name=@contact_name,
     contact_phone=@contact_phone, contact_email=@contact_email, status=@status, receipts_status=@receipts_status
     WHERE id=@id`
  );
  stmt.run(partner);
  return { ok: true };
});
ipcMain.handle('partners:delete', (_e, rawId: number) => {
  const id = ensureNumber(rawId, 'id', { integer: true, min: 1 });
  db.prepare('DELETE FROM partners WHERE id=?').run(id);
  return { ok: true };
});

/** IPC — Kanban (pipeline de comprovantes) */
ipcMain.handle('kanban:list', () => {
  return db.prepare('SELECT * FROM kanban ORDER BY company, stage').all();
});
ipcMain.handle('kanban:upsert', (_e, payload) => {
  const item = validateKanbanPayload(payload);
  const stmt = db.prepare(
    `INSERT INTO kanban (company, stage, receipts, total)
     VALUES (@company,@stage,@receipts,@total)
     ON CONFLICT(company, stage) DO UPDATE SET receipts=@receipts, total=@total`
  );
  stmt.run(item);
  return { ok: true };
});
