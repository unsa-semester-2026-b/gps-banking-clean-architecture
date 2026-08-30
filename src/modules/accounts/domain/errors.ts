import { DomainError } from '../../../shared/domain/domain-error';
import { Money } from './money';

/**
 * CAPA: dominio.
 *
 * Errores de negocio del módulo de cuentas. Cada uno es una CLASE con datos
 * propios, no un string suelto: quien lo recibe puede inspeccionarlo,
 * traducirlo o mapearlo a HTTP sin parsear mensajes.
 */

export class InvalidHolderNameError extends DomainError {
  readonly code = 'INVALID_HOLDER_NAME';

  constructor(value: string) {
    super(`Nombre de titular inválido: "${value}". Debe tener al menos 3 caracteres`);
  }
}

export class AmountMustBePositiveError extends DomainError {
  readonly code = 'AMOUNT_MUST_BE_POSITIVE';

  constructor() {
    super('El monto de la operación debe ser mayor que cero');
  }
}

export class CurrencyMismatchError extends DomainError {
  readonly code = 'CURRENCY_MISMATCH';

  constructor(accountCurrency: string, operationCurrency: string) {
    super(
      `La cuenta opera en ${accountCurrency} y se intentó una operación en ${operationCurrency}`,
    );
  }
}

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';

  constructor(
    readonly balance: Money,
    readonly requested: Money,
  ) {
    super(
      `Fondos insuficientes: el saldo es ${balance.format()} y se intentó retirar ${requested.format()}`,
    );
  }
}

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(accountNumber: string) {
    super(`No existe una cuenta con número ${accountNumber}`);
  }
}

export class SameAccountTransferError extends DomainError {
  readonly code = 'SAME_ACCOUNT_TRANSFER';

  constructor() {
    super('No se puede transferir dinero a la misma cuenta de origen');
  }
}
