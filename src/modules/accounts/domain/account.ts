import { Either, left, right } from '../../../shared/domain/either';
import { AccountNumber } from './account-number';
import {
  AmountMustBePositiveError,
  CurrencyMismatchError,
  InsufficientFundsError,
  InvalidHolderNameError,
} from './errors';
import { Currency, Money } from './money';

/**
 * CAPA: dominio.
 *
 * `Account` es el AGREGADO: la entidad que protege las reglas del negocio.
 * Fíjate en tres cosas que lo diferencian de los otros dos repos:
 *
 *  1. NO extiende nada de ningún framework (en banking-ddd-nest el agregado
 *     extendía `AggregateRoot` de @nestjs/cqrs: dominio acoplado a NestJS).
 *  2. NO es anémico (en utp, `Archive` era una bolsa de getters y la lógica
 *     vivía en use cases y repositorios). Aquí las reglas — "no retirar más
 *     del saldo", "misma moneda" — viven DENTRO del agregado. Es imposible
 *     dejar la cuenta en un estado inválido desde afuera.
 *  3. Cada método de negocio declara en su TIPO todo lo que puede salir mal.
 */

/** Forma "plana" del agregado, para persistirlo o exponerlo. Tipada, nunca `any`. */
export interface AccountPrimitives {
  number: string;
  holderName: string;
  balance: number;
  currency: Currency;
}

export class Account {
  private constructor(
    readonly number: AccountNumber,
    readonly holderName: string,
    private balance: Money,
  ) {}

  /** Única forma de abrir una cuenta nueva: valida las reglas de apertura. */
  static open(
    number: AccountNumber,
    holderName: string,
    currency: Currency,
  ): Either<InvalidHolderNameError, Account> {
    const name = holderName.trim();
    if (name.length < 3) {
      return left(new InvalidHolderNameError(holderName));
    }
    return right(new Account(number, name, Money.zero(currency)));
  }

  deposit(amount: Money): Either<AmountMustBePositiveError | CurrencyMismatchError, void> {
    const validation = this.validateOperation(amount);
    if (validation.isLeft()) return validation;

    this.balance = this.balance.add(amount);
    return right(undefined);
  }

  withdraw(
    amount: Money,
  ): Either<AmountMustBePositiveError | CurrencyMismatchError | InsufficientFundsError, void> {
    const validation = this.validateOperation(amount);
    if (validation.isLeft()) return validation;

    if (amount.isGreaterThan(this.balance)) {
      return left(new InsufficientFundsError(this.balance, amount));
    }
    this.balance = this.balance.subtract(amount);
    return right(undefined);
  }

  getBalance(): Money {
    return this.balance;
  }

  get currency(): Currency {
    return this.balance.currency;
  }

  private validateOperation(
    amount: Money,
  ): Either<AmountMustBePositiveError | CurrencyMismatchError, void> {
    if (!amount.isPositive()) {
      return left(new AmountMustBePositiveError());
    }
    if (!amount.hasSameCurrencyAs(this.balance)) {
      return left(new CurrencyMismatchError(this.balance.currency, amount.currency));
    }
    return right(undefined);
  }

  /**
   * Frontera de serialización: SOLO los adaptadores de persistencia y los
   * DTOs de salida usan esto. El resto del sistema trabaja con el agregado.
   */
  toPrimitives(): AccountPrimitives {
    return {
      number: this.number.value,
      holderName: this.holderName,
      balance: this.balance.toNumber(),
      currency: this.balance.currency,
    };
  }

  /** Reconstrucción desde almacenamiento propio: datos corruptos = bug = throw. */
  static fromPrimitives(primitives: AccountPrimitives): Account {
    const numberOrError = AccountNumber.create(primitives.number);
    if (numberOrError.isLeft()) {
      throw new Error(`Datos corruptos en almacenamiento: número "${primitives.number}"`);
    }
    return new Account(
      numberOrError.value,
      primitives.holderName,
      Money.fromPrimitives(primitives.balance, primitives.currency),
    );
  }
}
