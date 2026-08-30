import { Account, AccountPrimitives } from '../../domain/account';
import { AccountNumber } from '../../domain/account-number';
import { AccountRepository } from '../../domain/account-repository';

/**
 * CAPA: infraestructura (ADAPTADOR del puerto AccountRepository).
 *
 * Guarda las cuentas en un Map. Sirve para desarrollo y para los tests de
 * los casos de uso: probamos TODA la lógica sin levantar una base de datos.
 *
 * Detalle deliberado: guardamos PRIMITIVAS (una foto del estado), no la
 * instancia viva del agregado. Si guardáramos la referencia, cualquier
 * mutación posterior "se persistiría sola" sin pasar por save(), y este
 * repo se comportaría distinto a uno real.
 */
export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, AccountPrimitives>();

  async save(account: Account): Promise<void> {
    this.accounts.set(account.number.value, account.toPrimitives());
  }

  async findByNumber(number: AccountNumber): Promise<Account | null> {
    const primitives = this.accounts.get(number.value);
    if (primitives === undefined) return null;
    return Account.fromPrimitives(primitives);
  }
}
