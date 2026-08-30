import { Request, Response, Router } from 'express';

import { DepositMoneyUseCase } from '../../application/deposit-money.use-case';
import { GetAccountUseCase } from '../../application/get-account.use-case';
import { OpenAccountUseCase } from '../../application/open-account.use-case';
import { TransferMoneyUseCase } from '../../application/transfer-money.use-case';
import { WithdrawMoneyUseCase } from '../../application/withdraw-money.use-case';
import { respondWithDomainError } from './http-error-map';

/**
 * CAPA: infraestructura (ADAPTADOR de entrada: HTTP/Express).
 *
 * El controlador es deliberadamente "tonto". Solo hace tres cosas:
 *   1. Extraer datos crudos del request (sin validar reglas: eso es del dominio;
 *      fíjate que si llega basura, `Money.create` o los VOs la rechazan).
 *   2. Invocar el caso de uso.
 *   3. Traducir el Either a una respuesta HTTP.
 *
 * Express solo aparece en esta carpeta y en src/app. Ni el dominio ni los
 * casos de uso saben que existe la web.
 */

export interface AccountsUseCases {
  openAccount: OpenAccountUseCase;
  getAccount: GetAccountUseCase;
  depositMoney: DepositMoneyUseCase;
  withdrawMoney: WithdrawMoneyUseCase;
  transferMoney: TransferMoneyUseCase;
}

/** Express 4 no captura errores async; este wrapper convierte bugs en 500. */
const handle =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response): void => {
    handler(req, res).catch((error: unknown) => {
      console.error('Error inesperado:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } });
    });
  };

export const buildAccountsRouter = (useCases: AccountsUseCases): Router => {
  const router = Router();
  const body = (req: Request): Record<string, unknown> =>
    (req.body ?? {}) as Record<string, unknown>;

  router.post(
    '/accounts',
    handle(async (req, res) => {
      const result = await useCases.openAccount.execute({
        holderName: String(body(req).holderName ?? ''),
        currency: String(body(req).currency ?? ''),
      });
      if (result.isLeft()) return respondWithDomainError(res, result.error);
      res.status(201).json(result.value);
    }),
  );

  router.get(
    '/accounts/:number',
    handle(async (req, res) => {
      const result = await useCases.getAccount.execute({ accountNumber: req.params.number ?? '' });
      if (result.isLeft()) return respondWithDomainError(res, result.error);
      res.status(200).json(result.value);
    }),
  );

  router.post(
    '/accounts/:number/deposits',
    handle(async (req, res) => {
      const result = await useCases.depositMoney.execute({
        accountNumber: req.params.number ?? '',
        amount: Number(body(req).amount),
        currency: String(body(req).currency ?? ''),
      });
      if (result.isLeft()) return respondWithDomainError(res, result.error);
      res.status(200).json(result.value);
    }),
  );

  router.post(
    '/accounts/:number/withdrawals',
    handle(async (req, res) => {
      const result = await useCases.withdrawMoney.execute({
        accountNumber: req.params.number ?? '',
        amount: Number(body(req).amount),
        currency: String(body(req).currency ?? ''),
      });
      if (result.isLeft()) return respondWithDomainError(res, result.error);
      res.status(200).json(result.value);
    }),
  );

  router.post(
    '/transfers',
    handle(async (req, res) => {
      const result = await useCases.transferMoney.execute({
        fromAccountNumber: String(body(req).fromAccountNumber ?? ''),
        toAccountNumber: String(body(req).toAccountNumber ?? ''),
        amount: Number(body(req).amount),
        currency: String(body(req).currency ?? ''),
      });
      if (result.isLeft()) return respondWithDomainError(res, result.error);
      res.status(200).json(result.value);
    }),
  );

  return router;
};
