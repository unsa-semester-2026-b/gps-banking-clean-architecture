import { beforeEach, describe, expect, it } from 'vitest';

import { TransferMoneyUseCase } from '../../src/modules/accounts/application/transfer-money.use-case';
import { InMemoryAccountRepository } from '../../src/modules/accounts/infrastructure/persistence/in-memory-account-repository';
import { accountNumber, makeAccount, unwrap } from '../support/builders';

/**
 * El test más valioso del proyecto: la transferencia completa, con todas
 * sus reglas, probada sin base de datos, sin HTTP y sin mocks de librerías.
 * En los otros dos repos esta prueba era casi imposible de escribir.
 */
describe('TransferMoneyUseCase', () => {
  let repository: InMemoryAccountRepository;
  let useCase: TransferMoneyUseCase;

  beforeEach(async () => {
    repository = new InMemoryAccountRepository();
    useCase = new TransferMoneyUseCase(repository);
    await repository.save(makeAccount('1111111111', 'Ada Lovelace', 100));
    await repository.save(makeAccount('2222222222', 'Grace Hopper', 20));
  });

  it('mueve el dinero entre cuentas', async () => {
    const result = await useCase.execute({
      fromAccountNumber: '1111111111',
      toAccountNumber: '2222222222',
      amount: 30,
      currency: 'PEN',
    });

    const { from, to } = unwrap(result);
    expect(from.balance).toBe(70);
    expect(to.balance).toBe(50);
  });

  it('con fondos insuficientes: error tipado con los datos del problema', async () => {
    const result = await useCase.execute({
      fromAccountNumber: '1111111111',
      toAccountNumber: '2222222222',
      amount: 500,
      currency: 'PEN',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.error.code).toBe('INSUFFICIENT_FUNDS');
      // El error trae datos, no solo un mensaje: se puede mostrar, loguear o traducir.
      expect(result.error.message).toContain('100.00');
      expect(result.error.message).toContain('500.00');
    }
  });

  it('si la transferencia falla, NINGÚN saldo cambia (no hay estado corrupto)', async () => {
    await useCase.execute({
      fromAccountNumber: '1111111111',
      toAccountNumber: '2222222222',
      amount: 500,
      currency: 'PEN',
    });

    const from = await repository.findByNumber(accountNumber('1111111111'));
    const to = await repository.findByNumber(accountNumber('2222222222'));
    expect(from?.getBalance().toNumber()).toBe(100);
    expect(to?.getBalance().toNumber()).toBe(20);
  });

  it('rechaza transferir a la misma cuenta', async () => {
    const result = await useCase.execute({
      fromAccountNumber: '1111111111',
      toAccountNumber: '1111111111',
      amount: 10,
      currency: 'PEN',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('SAME_ACCOUNT_TRANSFER');
  });

  it('rechaza cuentas que no existen', async () => {
    const result = await useCase.execute({
      fromAccountNumber: '9999999999',
      toAccountNumber: '2222222222',
      amount: 10,
      currency: 'PEN',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('rechaza entrada basura sin tocar el dominio a mano: los VOs la filtran', async () => {
    const result = await useCase.execute({
      fromAccountNumber: 'hola',
      toAccountNumber: '2222222222',
      amount: Number.NaN,
      currency: 'XXX',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('INVALID_ACCOUNT_NUMBER');
  });
});
