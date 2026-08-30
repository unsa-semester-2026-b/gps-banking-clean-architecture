import { Response } from 'express';

import { DomainError } from '../../../../shared/domain/domain-error';

/**
 * CAPA: infraestructura.
 *
 * Traducir errores de negocio a códigos HTTP es responsabilidad del
 * adaptador HTTP: el dominio dice "fondos insuficientes" y AQUÍ se decide
 * que eso es un 422. Si mañana expones el sistema por gRPC o CLI, el
 * dominio no cambia; solo escribes otro mapa como este.
 */
const STATUS_BY_ERROR_CODE: Record<string, number> = {
  INVALID_ACCOUNT_NUMBER: 400,
  INVALID_CURRENCY: 400,
  INVALID_MONEY: 400,
  INVALID_HOLDER_NAME: 400,
  AMOUNT_MUST_BE_POSITIVE: 400,
  SAME_ACCOUNT_TRANSFER: 400,
  ACCOUNT_NOT_FOUND: 404,
  CURRENCY_MISMATCH: 409,
  INSUFFICIENT_FUNDS: 422,
};

export const respondWithDomainError = (res: Response, error: DomainError): void => {
  const status = STATUS_BY_ERROR_CODE[error.code] ?? 400;
  res.status(status).json({ error: { code: error.code, message: error.message } });
};
