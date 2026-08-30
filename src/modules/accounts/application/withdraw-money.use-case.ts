import { Either, left, right } from '../../../shared/domain/either';
import { AccountPrimitives } from '../domain/account';
import { AccountNumber, InvalidAccountNumberError } from '../domain/account-number';
import { AccountRepository } from '../domain/account-repository';
import {
  AccountNotFoundError,
  AmountMustBePositiveError,
  CurrencyMismatchError,
  InsufficientFundsError,
} from '../domain/errors';
import { InvalidCurrencyError, InvalidMoneyError, Money, parseCurrency } from '../domain/money';

/** CAPA: aplicación. Mismo patrón que el depósito; cambia la regla invocada. */

export interface WithdrawMoneyInput {
  accountNumber: string;
  amount: number;
  currency: string;
}

export type WithdrawMoneyError =
  | InvalidAccountNumberError
  | InvalidCurrencyError
  | InvalidMoneyError
  | AccountNotFoundError
  | AmountMustBePositiveError
  | CurrencyMismatchError
  | InsufficientFundsError;

export class WithdrawMoneyUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: WithdrawMoneyInput): Promise<Either<WithdrawMoneyError, AccountPrimitives>> {
    const numberOrError = AccountNumber.create(input.accountNumber);
    if (numberOrError.isLeft()) return left(numberOrError.error);

    const currencyOrError = parseCurrency(input.currency);
    if (currencyOrError.isLeft()) return left(currencyOrError.error);

    const amountOrError = Money.create(input.amount, currencyOrError.value);
    if (amountOrError.isLeft()) return left(amountOrError.error);

    const account = await this.accountRepository.findByNumber(numberOrError.value);
    if (account === null) return left(new AccountNotFoundError(input.accountNumber));

    const withdrawOrError = account.withdraw(amountOrError.value);
    if (withdrawOrError.isLeft()) return left(withdrawOrError.error);

    await this.accountRepository.save(account);
    return right(account.toPrimitives());
  }
}
