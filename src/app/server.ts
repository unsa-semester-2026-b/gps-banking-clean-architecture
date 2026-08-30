import express, { Express } from 'express';

import {
  AccountsUseCases,
  buildAccountsRouter,
} from '../modules/accounts/infrastructure/http/accounts-router';

/** Arma la aplicación Express montando los routers de cada módulo. */
export const buildApp = (useCases: AccountsUseCases): Express => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', buildAccountsRouter(useCases));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada' } });
  });

  return app;
};
