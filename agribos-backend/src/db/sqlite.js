import {
  query as dbQuery,
  get as dbGet,
  run as dbRun,
  exec as dbExec,
  runInTransaction as dbTx,
  initDb as dbInit,
  getSqliteDb
} from './database.js';

export const query = dbQuery;
export const get = dbGet;
export const run = dbRun;
export const exec = dbExec;
export const runInTransaction = dbTx;
export const initDb = dbInit;
export const db = getSqliteDb();

export default {
  query,
  get,
  run,
  exec,
  runInTransaction,
  initDb,
};
