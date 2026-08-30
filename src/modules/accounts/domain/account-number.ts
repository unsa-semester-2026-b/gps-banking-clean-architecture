import { DomainError } from '../../../shared/domain/domain-error';
import { Either, left, right } from '../../../shared/domain/either';

/**
 * CAPA: dominio.
 *
 * Value object para el número de cuenta. ¿Por qué no usar `string` a secas?
 * Porque un `string` puede ser cualquier cosa ("hola", "", "123"). Un
 * `AccountNumber` solo puede existir si tiene el formato correcto, y el
 * sistema de tipos propaga esa garantía a todas las capas.
 */

export class InvalidAccountNumberError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_NUMBER';

  constructor(value: string) {
    super(`Número de cuenta inválido: "${value}". Debe tener exactamente 10 dígitos`);
  }
}

export class AccountNumber {
  private static readonly FORMAT = /^\d{10}$/;

  private constructor(readonly value: string) {}

  static create(value: string): Either<InvalidAccountNumberError, AccountNumber> {
    const normalized = value.trim();
    if (!AccountNumber.FORMAT.test(normalized)) {
      return left(new InvalidAccountNumberError(value));
    }
    return right(new AccountNumber(normalized));
  }

  equals(other: AccountNumber): boolean {
    return this.value === other.value;
  }
}
