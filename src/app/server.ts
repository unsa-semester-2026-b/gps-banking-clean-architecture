import path from 'node:path';
import express, { Express } from 'express';

import {
  AccountsUseCases,
  buildAccountsRouter,
} from '../modules/accounts/infrastructure/http/accounts-router';

/** Arma la aplicación Express montando los routers de cada módulo y sirviendo la UI. */
export const buildApp = (useCases: AccountsUseCases): Express => {
  const app = express();
  app.use(express.json());

  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', buildAccountsRouter(useCases));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } });
  });

  return app;
};
