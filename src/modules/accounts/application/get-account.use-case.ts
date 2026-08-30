import { Either, left, right } from '../../../shared/domain/either';
import { AccountPrimitives } from '../domain/account';
import { AccountNumber, InvalidAccountNumberError } from '../domain/account-number';
import { AccountRepository } from '../domain/account-repository';
import { AccountNotFoundError } from '../domain/errors';

/**
 * CAPA: aplicación.
 *
 * Caso de uso de LECTURA. Para consultas simples basta con devolver las
 * primitivas del agregado; en sistemas grandes las lecturas suelen tener
 * sus propios modelos optimizados (CQRS), pero eso es una optimización,
 * no un requisito de Clean Architecture.
 */

export interface GetAccountInput {
  accountNumber: string;
}

export type GetAccountError = InvalidAccountNumberError | AccountNotFoundError;

export class GetAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: GetAccountInput): Promise<Either<GetAccountError, AccountPrimitives>> {
    const numberOrError = AccountNumber.create(input.accountNumber);
    if (numberOrError.isLeft()) return left(numberOrError.error);

    const account = await this.accountRepository.findByNumber(numberOrError.value);
    if (account === null) return left(new AccountNotFoundError(input.accountNumber));

    return right(account.toPrimitives());
  }
}
