import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const dbFolder = app.getPath('userData');
const dbPath = path.join(dbFolder, 'aquadistrib.sqlite');

export let db: Database.Database;

export async function ensureDB() {
  if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
  db = new Database(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      stores INTEGER DEFAULT 0,
      total_value REAL DEFAULT 0,
      status TEXT DEFAULT 'ativo',
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT,
      cities_json TEXT DEFAULT '[]',
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      status TEXT DEFAULT 'ativo',
      receipts_status TEXT DEFAULT 'pendente'
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

    CREATE TABLE IF NOT EXISTS kanban (
      company TEXT NOT NULL,
      stage TEXT NOT NULL,
      receipts INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      PRIMARY KEY (company, stage)
    );
  `);

  seedIfEmpty();
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number };
  if (count.c > 0) return;

  const insertCompany = db.prepare(`
    INSERT INTO companies (name,type,stores,total_value,status,contact_name,contact_phone,contact_email)
    VALUES (@name,@type,@stores,@total_value,'ativo',@contact_name,@contact_phone,@contact_email)
  `);
  const insertPartner = db.prepare(`
    INSERT INTO partners (name,region,cities_json,contact_name,contact_phone,contact_email,status,receipts_status)
    VALUES (@name,@region,@cities_json,@contact_name,@contact_phone,@contact_email,'ativo',@receipts_status)
  `);
  const insertKanban = db.prepare(`
    INSERT INTO kanban (company,stage,receipts,total) VALUES (@company,@stage,@receipts,@total)
  `);

  insertCompany.run({
    name: 'ANIMALE', type: 'Moda Feminina', stores: 89, total_value: 15420.50,
    contact_name: 'Maria Silva', contact_phone: '(11) 99999-9999', contact_email: 'contato@animale.com.br'
  });
  insertCompany.run({
    name: 'AREZZO', type: 'Calçados e Acessórios', stores: 14, total_value: 8350.75,
    contact_name: 'João Santos', contact_phone: '(11) 88888-8888', contact_email: 'parceria@arezzo.com.br'
  });
  insertCompany.run({
    name: 'BAGAGGIO', type: 'Artefatos de Couro', stores: 29, total_value: 12200.25,
    contact_name: 'Ana Costa', contact_phone: '(11) 77777-7777', contact_email: 'suprimentos@bagaggio.com.br'
  });

  insertPartner.run({
    name: 'Águas do Sul Ltda', region: 'Sul', cities_json: JSON.stringify(['Porto Alegre','Curitiba','Florianópolis']),
    contact_name: 'Carlos Mendes', contact_phone: '(51) 99999-0001', contact_email: 'carlos@aguasdosul.com.br',
    receipts_status: 'enviado'
  });
  insertPartner.run({
    name: 'Distribuição Nordeste', region: 'Nordeste', cities_json: JSON.stringify(['Salvador','Recife','Fortaleza']),
    contact_name: 'Paula Oliveira', contact_phone: '(71) 99999-0002', contact_email: 'paula@distribnordeste.com.br',
    receipts_status: 'pendente'
  });
  insertPartner.run({
    name: 'SP Águas Express', region: 'Sudeste', cities_json: JSON.stringify(['São Paulo','Campinas','Santos']),
    contact_name: 'Roberto Lima', contact_phone: '(11) 99999-0003', contact_email: 'roberto@spaguas.com.br',
    receipts_status: 'enviado'
  });

  [
    { company: 'ANIMALE', stage: 'recebimento', receipts: 45, total: 89 },
    { company: 'AREZZO', stage: 'relatorio',   receipts: 14, total: 14 },
    { company: 'BAGAGGIO', stage: 'nota_fiscal', receipts: 29, total: 29 }
  ].forEach(k => insertKanban.run(k));
}
