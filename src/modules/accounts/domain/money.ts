import { DomainError } from '../../../shared/domain/domain-error';
import { Either, left, right } from '../../../shared/domain/either';

/**
 * CAPA: dominio.
 *
 * `Money` es un VALUE OBJECT: un objeto pequeño e inmutable que envuelve un
 * dato primitivo y GARANTIZA que siempre es válido. Si tienes un `Money` en
 * la mano, ya no necesitas volver a validarlo en ninguna otra capa.
 *
 * Dos decisiones de diseño importantes:
 *  1. Guardamos el monto en CENTAVOS (entero). `0.1 + 0.2 !== 0.3` en
 *     JavaScript; con enteros el dinero nunca pierde precisión.
 *  2. El constructor es privado: la ÚNICA puerta de entrada es `create()`,
 *     que valida y devuelve `Either`. Es imposible fabricar dinero inválido.
 */

export const CURRENCIES = ['PEN', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export class InvalidMoneyError extends DomainError {
  readonly code = 'INVALID_MONEY';

  constructor(reason: string) {
    super(`Monto inválido: ${reason}`);
  }
}

export class InvalidCurrencyError extends DomainError {
  readonly code = 'INVALID_CURRENCY';

  constructor(value: string) {
    super(`Moneda inválida: "${value}". Monedas soportadas: ${CURRENCIES.join(', ')}`);
  }
}

export const parseCurrency = (value: string): Either<InvalidCurrencyError, Currency> => {
  const normalized = value.trim().toUpperCase();
  const found = CURRENCIES.find((currency) => currency === normalized);
  if (found === undefined) return left(new InvalidCurrencyError(value));
  return right(found);
};

export class Money {
  private constructor(
    readonly cents: number,
    readonly currency: Currency,
  ) {}

  /** Valida datos que vienen "de afuera" (HTTP, formularios). Puede fallar. */
  static create(amount: number, currency: Currency): Either<InvalidMoneyError, Money> {
    if (!Number.isFinite(amount)) {
      return left(new InvalidMoneyError(`se esperaba un número y llegó "${amount}"`));
    }
    if (amount < 0) {
      return left(new InvalidMoneyError('no puede ser negativo'));
    }
    const cents = Math.round(amount * 100);
    if (Math.abs(amount * 100 - cents) > 1e-6) {
      return left(new InvalidMoneyError('no puede tener más de 2 decimales'));
    }
    return right(new Money(cents, currency));
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  /**
   * Reconstruye desde nuestro propio almacenamiento. Si los datos guardados
   * están corruptos eso ES un bug (no un fallo de negocio), por eso aquí
   * se lanza excepción en lugar de devolver Either.
   */
  static fromPrimitives(amount: number, currency: string): Money {
    const currencyOrError = parseCurrency(currency);
    if (currencyOrError.isLeft()) {
      throw new Error(`Datos corruptos en almacenamiento: moneda "${currency}"`);
    }
    const moneyOrError = Money.create(amount, currencyOrError.value);
    if (moneyOrError.isLeft()) {
      throw new Error(`Datos corruptos en almacenamiento: monto "${amount}"`);
    }
    return moneyOrError.value;
  }

  /** Las operaciones devuelven un Money NUEVO: los value objects son inmutables. */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.cents - other.cents;
    // Quien llama debe verificar fondos ANTES (regla de negocio del Account).
    // Si llegamos aquí en negativo, es un bug: por eso throw y no Either.
    if (result < 0) {
      throw new Error('Bug: se intentó restar más dinero del disponible sin validar antes');
    }
    return new Money(result, this.currency);
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  hasSameCurrencyAs(other: Money): boolean {
    return this.currency === other.currency;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  toNumber(): number {
    return this.cents / 100;
  }

  format(): string {
    return `${this.currency} ${this.toNumber().toFixed(2)}`;
  }

  private assertSameCurrency(other: Money): void {
    if (!this.hasSameCurrencyAs(other)) {
      throw new Error(
        `Bug: operación entre monedas distintas (${this.currency} y ${other.currency}) sin validar antes`,
      );
    }
  }
}
