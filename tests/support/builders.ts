import { Either } from '../../src/shared/domain/either';
import { Account } from '../../src/modules/accounts/domain/account';
import { AccountNumber } from '../../src/modules/accounts/domain/account-number';
import { AccountNumberGenerator } from '../../src/modules/accounts/domain/account-number-generator';
import { Currency, Money } from '../../src/modules/accounts/domain/money';

/** Desenvuelve un Either en tests: si es Left, el test truena con mensaje claro. */
export const unwrap = <L, R>(either: Either<L, R>): R => {
  if (either.isLeft()) {
    throw new Error(`Se esperaba éxito pero falló con: ${JSON.stringify(either.error)}`);
  }
  return either.value;
};

export const money = (amount: number, currency: Currency = 'PEN'): Money =>
  unwrap(Money.create(amount, currency));

export const accountNumber = (value: string): AccountNumber =>
  unwrap(AccountNumber.create(value));

export const makeAccount = (
  number: string,
  holderName = 'Ada Lovelace',
  initialBalance = 0,
  currency: Currency = 'PEN',
): Account => {
  const account = unwrap(Account.open(accountNumber(number), holderName, currency));
  if (initialBalance > 0) {
    unwrap(account.deposit(money(initialBalance, currency)));
  }
  return account;
};

/**
 * Doble de prueba del puerto AccountNumberGenerator: devuelve números
 * predefinidos. Así el test de "abrir cuenta" es 100% determinista.
 */
export class FixedAccountNumberGenerator implements AccountNumberGenerator {
  constructor(private readonly queue: string[]) {}

  next(): AccountNumber {
    const value = this.queue.shift();
    if (value === undefined) throw new Error('FixedAccountNumberGenerator se quedó sin números');
    return accountNumber(value);
  }
}
