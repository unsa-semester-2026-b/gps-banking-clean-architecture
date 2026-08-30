import { Either, left, right } from '../../../shared/domain/either';
import { AccountPrimitives } from '../domain/account';
import { AccountNumber, InvalidAccountNumberError } from '../domain/account-number';
import { AccountRepository } from '../domain/account-repository';
import {
  AccountNotFoundError,
  AmountMustBePositiveError,
  CurrencyMismatchError,
  InsufficientFundsError,
  SameAccountTransferError,
} from '../domain/errors';
import { InvalidCurrencyError, InvalidMoneyError, Money, parseCurrency } from '../domain/money';

/**
 * CAPA: aplicación.
 *
 * La transferencia toca DOS agregados, y el orden importa:
 * mutamos ambos en memoria y SOLO si todo salió bien persistimos. Si el
 * depósito falla, la cuenta de origen mutada se descarta sin guardarse:
 * no queda estado corrupto.
 *
 * (Compara con `MoneyTransferService` de banking-ddd-nest: devolvía un
 * `boolean`, hacía `console.log` del error y lo perdía para siempre.)
 *
 * Con una base de datos real, los dos `save` irían dentro de una
 * transacción — un detalle que se resuelve en INFRAESTRUCTURA (patrón
 * Unit of Work), no aquí.
 */

export interface TransferMoneyInput {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
}

export interface TransferMoneyOutput {
  from: AccountPrimitives;
  to: AccountPrimitives;
}

export type TransferMoneyError =
  | InvalidAccountNumberError
  | InvalidCurrencyError
  | InvalidMoneyError
  | SameAccountTransferError
  | AccountNotFoundError
  | AmountMustBePositiveError
  | CurrencyMismatchError
  | InsufficientFundsError;

export class TransferMoneyUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(
    input: TransferMoneyInput,
  ): Promise<Either<TransferMoneyError, TransferMoneyOutput>> {
    const fromNumberOrError = AccountNumber.create(input.fromAccountNumber);
    if (fromNumberOrError.isLeft()) return left(fromNumberOrError.error);

    const toNumberOrError = AccountNumber.create(input.toAccountNumber);
    if (toNumberOrError.isLeft()) return left(toNumberOrError.error);

    if (fromNumberOrError.value.equals(toNumberOrError.value)) {
      return left(new SameAccountTransferError());
    }

    const currencyOrError = parseCurrency(input.currency);
    if (currencyOrError.isLeft()) return left(currencyOrError.error);

    const amountOrError = Money.create(input.amount, currencyOrError.value);
    if (amountOrError.isLeft()) return left(amountOrError.error);
    const amount = amountOrError.value;

    const from = await this.accountRepository.findByNumber(fromNumberOrError.value);
    if (from === null) return left(new AccountNotFoundError(input.fromAccountNumber));

    const to = await this.accountRepository.findByNumber(toNumberOrError.value);
    if (to === null) return left(new AccountNotFoundError(input.toAccountNumber));

    const withdrawOrError = from.withdraw(amount);
    if (withdrawOrError.isLeft()) return left(withdrawOrError.error);

    const depositOrError = to.deposit(amount);
    if (depositOrError.isLeft()) return left(depositOrError.error);

    await this.accountRepository.save(from);
    await this.accountRepository.save(to);

    return right({ from: from.toPrimitives(), to: to.toPrimitives() });
  }
}
