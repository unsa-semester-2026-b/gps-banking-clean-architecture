import { Account } from './account';
import { AccountNumber } from './account-number';

/**
 * CAPA: dominio (esto es un PUERTO).
 *
 * Aquí está el truco central de Clean Architecture: la INVERSIÓN DE
 * DEPENDENCIAS. El dominio declara QUÉ necesita (guardar y buscar cuentas)
 * sin saber CÓMO se hace. La implementación concreta (memoria, JSON,
 * Postgres, S3...) vive en infraestructura y "apunta hacia adentro"
 * implementando esta interfaz.
 *
 * Reglas de un buen puerto (compáralo con `ArchiveRepository` de utp, que
 * recibía `any` y mezclaba S3 + consultas de otros módulos):
 *   - Habla SOLO en tipos del dominio (Account, AccountNumber). Nunca `any`,
 *     nunca modelos de Sequelize, nunca DTOs de HTTP.
 *   - Métodos mínimos y de una sola responsabilidad.
 */
export interface AccountRepository {
  /** Crea o actualiza (semántica upsert). */
  save(account: Account): Promise<void>;

  findByNumber(number: AccountNumber): Promise<Account | null>;
}
