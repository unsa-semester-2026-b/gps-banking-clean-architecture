import { describe, expect, it } from 'vitest';

import { Account } from '../../src/modules/accounts/domain/account';
import { accountNumber, makeAccount, money, unwrap } from '../support/builders';

describe('Account (el agregado protege sus reglas)', () => {
  it('abre una cuenta con saldo cero', () => {
    const account = unwrap(Account.open(accountNumber('1234567890'), 'Grace Hopper', 'PEN'));

    expect(account.getBalance().toNumber()).toBe(0);
    expect(account.holderName).toBe('Grace Hopper');
  });

  it('rechaza abrir una cuenta con nombre de titular inválido', () => {
    const result = Account.open(accountNumber('1234567890'), '  a ', 'PEN');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('INVALID_HOLDER_NAME');
  });

  it('acumula depósitos en el saldo', () => {
    const account = makeAccount('1234567890');

    unwrap(account.deposit(money(100)));
    unwrap(account.deposit(money(50.25)));

    expect(account.getBalance().toNumber()).toBe(150.25);
  });

  it('rechaza depósitos de cero: el error viene tipado, no como string', () => {
    const account = makeAccount('1234567890');
    const result = account.deposit(money(0));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('AMOUNT_MUST_BE_POSITIVE');
  });

  it('rechaza operar en otra moneda', () => {
    const account = makeAccount('1234567890', 'Ada', 100, 'PEN');
    const result = account.deposit(money(10, 'USD'));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('CURRENCY_MISMATCH');
  });

  it('NUNCA permite retirar más del saldo (la regla vive en el agregado)', () => {
    const account = makeAccount('1234567890', 'Ada', 50);

    const result = account.withdraw(money(80));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.error.code).toBe('INSUFFICIENT_FUNDS');
    }
    // Y el saldo quedó intacto: el estado inválido es imposible.
    expect(account.getBalance().toNumber()).toBe(50);
  });

  it('sobrevive el viaje a persistencia y de regreso (toPrimitives/fromPrimitives)', () => {
    const original = makeAccount('9999999999', 'Marie Curie', 75.5);

    const restored = Account.fromPrimitives(original.toPrimitives());

    expect(restored.getBalance().equals(original.getBalance())).toBe(true);
    expect(restored.number.equals(original.number)).toBe(true);
    expect(restored.holderName).toBe('Marie Curie');
  });
});
