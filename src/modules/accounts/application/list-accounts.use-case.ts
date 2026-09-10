import { Either, right } from '../../../shared/domain/either';
import { AccountPrimitives } from '../domain/account';
import { AccountRepository } from '../domain/account-repository';

/**
 * CAPA: aplicación.
 * Caso de uso: Listar todas las cuentas registradas en el sistema.
 */
export class ListAccountsUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(): Promise<Either<never, AccountPrimitives[]>> {
    const accounts = await this.accountRepository.findAll();
    return right(accounts.map((acc) => acc.toPrimitives()));
  }
}
