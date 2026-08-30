import { Either, left, right } from '../../../shared/domain/either';
import { Account, AccountPrimitives } from '../domain/account';
import { AccountNumberGenerator } from '../domain/account-number-generator';
import { AccountRepository } from '../domain/account-repository';
import { InvalidHolderNameError } from '../domain/errors';
import { InvalidCurrencyError, parseCurrency } from '../domain/money';

/**
 * CAPA: aplicación.
 *
 * Un caso de uso = UNA acción que el sistema ofrece, con nombre de negocio.
 * Su trabajo es solo ORQUESTAR: convertir la entrada cruda en objetos de
 * dominio, pedir al dominio que aplique sus reglas, y persistir. Nada de
 * SQL, nada de HTTP, nada de PDFs (en utp un caso de uso generaba PDFs con
 * pdfmake y tocaba `fs`: eso es trabajo de infraestructura).
 *
 * Entrada y salida son PRIMITIVOS (strings y números): los objetos de
 * dominio nunca cruzan la frontera hacia afuera.
 */

export interface OpenAccountInput {
  holderName: string;
  currency: string;
}

export type OpenAccountError = InvalidHolderNameError | InvalidCurrencyError;

export class OpenAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountNumberGenerator: AccountNumberGenerator,
  ) {}

  async execute(input: OpenAccountInput): Promise<Either<OpenAccountError, AccountPrimitives>> {
    const currencyOrError = parseCurrency(input.currency);
    if (currencyOrError.isLeft()) return left(currencyOrError.error);

    // En producción real habría que garantizar unicidad del número generado
    // (constraint UNIQUE en BD + reintento). Se omite por simplicidad.
    const number = this.accountNumberGenerator.next();

    const accountOrError = Account.open(number, input.holderName, currencyOrError.value);
    if (accountOrError.isLeft()) return left(accountOrError.error);

    const account = accountOrError.value;
    await this.accountRepository.save(account);

    return right(account.toPrimitives());
  }
}
