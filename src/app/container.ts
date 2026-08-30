import { join } from 'node:path';

import { DepositMoneyUseCase } from '../modules/accounts/application/deposit-money.use-case';
import { GetAccountUseCase } from '../modules/accounts/application/get-account.use-case';
import { OpenAccountUseCase } from '../modules/accounts/application/open-account.use-case';
import { TransferMoneyUseCase } from '../modules/accounts/application/transfer-money.use-case';
import { WithdrawMoneyUseCase } from '../modules/accounts/application/withdraw-money.use-case';
import { AccountRepository } from '../modules/accounts/domain/account-repository';
import { AccountsUseCases } from '../modules/accounts/infrastructure/http/accounts-router';
import { InMemoryAccountRepository } from '../modules/accounts/infrastructure/persistence/in-memory-account-repository';
import { JsonFileAccountRepository } from '../modules/accounts/infrastructure/persistence/json-file-account-repository';
import { RandomAccountNumberGenerator } from '../modules/accounts/infrastructure/persistence/random-account-number-generator';

/**
 * COMPOSITION ROOT (raíz de composición).
 *
 * Este es el ÚNICO archivo que conoce las implementaciones concretas y las
 * conecta con los puertos. Es inyección de dependencias hecha a mano: sin
 * decoradores, sin contenedor mágico, sin framework. Para un proyecto chico
 * esto es todo lo que necesitas (Awilix o el DI de NestJS automatizan
 * exactamente esto cuando el grafo crece).
 *
 * Cambiar de persistencia = cambiar UNA línea aquí:
 *   PERSISTENCE=json npm run dev   ->  guarda en data/accounts.json
 *   npm run dev                    ->  guarda en memoria
 */
export const buildContainer = (): AccountsUseCases => {
  const accountRepository: AccountRepository =
    process.env.PERSISTENCE === 'json'
      ? new JsonFileAccountRepository(join(process.cwd(), 'data', 'accounts.json'))
      : new InMemoryAccountRepository();

  const accountNumberGenerator = new RandomAccountNumberGenerator();

  return {
    openAccount: new OpenAccountUseCase(accountRepository, accountNumberGenerator),
    getAccount: new GetAccountUseCase(accountRepository),
    depositMoney: new DepositMoneyUseCase(accountRepository),
    withdrawMoney: new WithdrawMoneyUseCase(accountRepository),
    transferMoney: new TransferMoneyUseCase(accountRepository),
  };
};
