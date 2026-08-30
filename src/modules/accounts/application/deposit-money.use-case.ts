import { Either, left, right } from '../../../shared/domain/either';
import { AccountPrimitives } from '../domain/account';
import { AccountNumber, InvalidAccountNumberError } from '../domain/account-number';
import { AccountRepository } from '../domain/account-repository';
import {
  AccountNotFoundError,
  AmountMustBePositiveError,
  CurrencyMismatchError,
} from '../domain/errors';
import { InvalidCurrencyError, InvalidMoneyError, Money, parseCurrency } from '../domain/money';

/**
 * CAPA: aplicación.
 *
 * Mira el tipo de retorno: `DepositMoneyError` enumera TODO lo que puede
 * salir mal. Es documentación que el compilador verifica — si mañana el
 * dominio agrega un error nuevo, este archivo no compila hasta manejarlo.
 */

export interface DepositMoneyInput {
  accountNumber: string;
  amount: number;
  currency: string;
}

export type DepositMoneyError =
  | InvalidAccountNumberError
  | InvalidCurrencyError
  | InvalidMoneyError
  | AccountNotFoundError
  | AmountMustBePositiveError
  | CurrencyMismatchError;

export class DepositMoneyUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: DepositMoneyInput): Promise<Either<DepositMoneyError, AccountPrimitives>> {
    // 1. Frontera: primitivas -> objetos de dominio (aquí muere el dato basura).
    const numberOrError = AccountNumber.create(input.accountNumber);
    if (numberOrError.isLeft()) return left(numberOrError.error);

    const currencyOrError = parseCurrency(input.currency);
    if (currencyOrError.isLeft()) return left(currencyOrError.error);

    const amountOrError = Money.create(input.amount, currencyOrError.value);
    if (amountOrError.isLeft()) return left(amountOrError.error);

    // 2. Cargar el agregado.
    const account = await this.accountRepository.findByNumber(numberOrError.value);
    if (account === null) return left(new AccountNotFoundError(input.accountNumber));

    // 3. La REGLA vive en el dominio; el caso de uso solo la invoca.
    const depositOrError = account.deposit(amountOrError.value);
    if (depositOrError.isLeft()) return left(depositOrError.error);

    // 4. Persistir y devolver primitivas.
    await this.accountRepository.save(account);
    return right(account.toPrimitives());
  }
}
