import { describe, expect, it } from 'vitest';

import { Money, parseCurrency } from '../../src/modules/accounts/domain/money';
import { money } from '../support/builders';

/**
 * Tests de DOMINIO: puros, instantáneos, sin mocks, sin base de datos.
 * Esta es la recompensa de mantener el dominio libre de frameworks.
 */
describe('Money', () => {
  it('crea un monto válido y lo guarda en centavos exactos', () => {
    const result = Money.create(10.5, 'PEN');

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.cents).toBe(1050);
      expect(result.value.toNumber()).toBe(10.5);
    }
  });

  it('rechaza montos negativos', () => {
    const result = Money.create(-5, 'PEN');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('INVALID_MONEY');
  });

  it('rechaza montos con más de 2 decimales', () => {
    expect(Money.create(10.999, 'PEN').isLeft()).toBe(true);
  });

  it('rechaza valores que no son números (NaN, Infinity)', () => {
    expect(Money.create(Number.NaN, 'PEN').isLeft()).toBe(true);
    expect(Money.create(Number.POSITIVE_INFINITY, 'PEN').isLeft()).toBe(true);
  });

  it('suma y resta sin errores de punto flotante', () => {
    // En JavaScript: 0.1 + 0.2 === 0.30000000000000004. Aquí no.
    const result = money(0.1).add(money(0.2));

    expect(result.toNumber()).toBe(0.3);
    expect(money(1).subtract(money(0.9)).toNumber()).toBe(0.1);
  });

  it('lanza excepción (bug) al operar monedas distintas sin validar antes', () => {
    expect(() => money(10, 'PEN').add(money(10, 'USD'))).toThrow();
  });

  it('parsea monedas soportadas y rechaza las demás', () => {
    expect(parseCurrency('pen').isRight()).toBe(true);
    expect(parseCurrency('EUR').isLeft()).toBe(true);
    expect(parseCurrency('').isLeft()).toBe(true);
  });
});
