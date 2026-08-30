import { describe, expect, it } from 'vitest';

import { OpenAccountUseCase } from '../../src/modules/accounts/application/open-account.use-case';
import { InMemoryAccountRepository } from '../../src/modules/accounts/infrastructure/persistence/in-memory-account-repository';
import { FixedAccountNumberGenerator, accountNumber, unwrap } from '../support/builders';

/**
 * Tests de APLICACIÓN: el caso de uso completo con un repositorio en memoria
 * y un generador fijo. Cero mocks de librerías, cero base de datos: los
 * puertos se sustituyen por implementaciones simples.
 */
describe('OpenAccountUseCase', () => {
  it('abre una cuenta y la deja consultable en el repositorio', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new OpenAccountUseCase(
      repository,
      new FixedAccountNumberGenerator(['1111111111']),
    );

    const result = await useCase.execute({ holderName: 'Ada Lovelace', currency: 'PEN' });

    const created = unwrap(result);
    expect(created).toEqual({
      number: '1111111111',
      holderName: 'Ada Lovelace',
      balance: 0,
      currency: 'PEN',
    });
    const stored = await repository.findByNumber(accountNumber('1111111111'));
    expect(stored).not.toBeNull();
  });

  it('devuelve el error de dominio si el nombre es inválido y NO guarda nada', async () => {
    const repository = new InMemoryAccountRepository();
    const useCase = new OpenAccountUseCase(
      repository,
      new FixedAccountNumberGenerator(['1111111111']),
    );

    const result = await useCase.execute({ holderName: 'x', currency: 'PEN' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('INVALID_HOLDER_NAME');
    expect(await repository.findByNumber(accountNumber('1111111111'))).toBeNull();
  });

  it('rechaza monedas no soportadas', async () => {
    const useCase = new OpenAccountUseCase(
      new InMemoryAccountRepository(),
      new FixedAccountNumberGenerator(['1111111111']),
    );

    const result = await useCase.execute({ holderName: 'Ada Lovelace', currency: 'BTC' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) expect(result.error.code).toBe('INVALID_CURRENCY');
  });
});
