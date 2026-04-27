import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/gold.db');

const BOOTSTRAP_SQL = [
  `CREATE TABLE IF NOT EXISTS tokens (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    address                   TEXT    NOT NULL UNIQUE,
    name                      TEXT    NOT NULL,
    symbol                    TEXT    NOT NULL,
    decimals                  INTEGER NOT NULL DEFAULT 18,
    deployer                  TEXT    NOT NULL,
    deployed_at               TEXT    NOT NULL,
    compliance_address        TEXT    NOT NULL,
    identity_registry_address TEXT    NOT NULL,
    gold_reserve_address      TEXT,
    tx_hash                   TEXT    NOT NULL,
    purity_standard           TEXT,
    custodian_address         TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS identities (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    address       TEXT    NOT NULL UNIQUE,
    is_verified   INTEGER NOT NULL DEFAULT 1,
    country_code  TEXT,
    registered_at TEXT    NOT NULL,
    updated_at    TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS gold_bars (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bar_id        TEXT    NOT NULL UNIQUE,
    token_address TEXT    NOT NULL REFERENCES tokens(address),
    weight_grams  REAL    NOT NULL,
    purity_bps    INTEGER NOT NULL,
    vault_id      TEXT    NOT NULL,
    custodian     TEXT    NOT NULL,
    assay_ref     TEXT,
    active        INTEGER NOT NULL DEFAULT 1,
    registered_at TEXT    NOT NULL,
    tx_hash       TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS redemptions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    redemption_ref   TEXT    NOT NULL UNIQUE,
    token_address    TEXT    NOT NULL REFERENCES tokens(address),
    investor_address TEXT    NOT NULL,
    requested_grams  REAL    NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'PENDING',
    delivery_address TEXT,
    requested_at     TEXT    NOT NULL,
    approved_at      TEXT,
    fulfilled_at     TEXT,
    rejected_at      TEXT,
    reject_reason    TEXT,
    burn_tx_hash     TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS gold_price (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    price_per_gram_usd TEXT    NOT NULL,
    currency           TEXT    NOT NULL DEFAULT 'USD',
    updated_at         TEXT    NOT NULL,
    updated_by         TEXT
  )`,
];

let _client: Client;
let _db: ReturnType<typeof drizzle<typeof schema>>;

export async function initializeDb() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _client = createClient({ url: `file:${DB_PATH}` });

  for (const sql of BOOTSTRAP_SQL) {
    await _client.execute(sql);
  }

  _db = drizzle(_client, { schema });
  return _db;
}

export function getDb() {
  if (!_db) throw new Error('DB not initialized — call initializeDb() first');
  return _db;
}
