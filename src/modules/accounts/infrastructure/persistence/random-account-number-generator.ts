import { randomInt } from 'node:crypto';

import { AccountNumber } from '../../domain/account-number';
import { AccountNumberGenerator } from '../../domain/account-number-generator';

/**
 * CAPA: infraestructura (ADAPTADOR del puerto AccountNumberGenerator).
 * La aleatoriedad es un detalle técnico; por eso vive aquí y no en el dominio.
 */
export class RandomAccountNumberGenerator implements AccountNumberGenerator {
  next(): AccountNumber {
    const digits = Array.from({ length: 10 }, () => randomInt(0, 10)).join('');
    const numberOrError = AccountNumber.create(digits);
    if (numberOrError.isLeft()) {
      throw new Error(`Bug: el generador produjo un número inválido: ${digits}`);
    }
    return numberOrError.value;
  }
}
