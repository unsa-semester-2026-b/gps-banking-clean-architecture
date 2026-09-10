import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Account, AccountPrimitives } from '../../domain/account';
import { AccountNumber } from '../../domain/account-number';
import { AccountRepository } from '../../domain/account-repository';

/**
 * CAPA: infraestructura (segundo ADAPTADOR del mismo puerto).
 *
 * Persiste en un archivo JSON. Existe para demostrar el beneficio real de
 * los puertos: cambiar de "memoria" a "archivo" (o mañana a Postgres) no
 * toca NI UNA LÍNEA del dominio ni de los casos de uso — solo se cambia
 * qué clase se registra en el arranque (src/app/container.ts).
 */
export class JsonFileAccountRepository implements AccountRepository {
  constructor(private readonly filePath: string) {}

  async save(account: Account): Promise<void> {
    const accounts = await this.readAll();
    accounts[account.number.value] = account.toPrimitives();
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(accounts, null, 2), 'utf-8');
  }

  async findByNumber(number: AccountNumber): Promise<Account | null> {
    const accounts = await this.readAll();
    const primitives = accounts[number.value];
    if (primitives === undefined) return null;
    return Account.fromPrimitives(primitives);
  }

  async findAll(): Promise<Account[]> {
    const accounts = await this.readAll();
    return Object.values(accounts).map((p) => Account.fromPrimitives(p));
  }

  private async readAll(): Promise<Record<string, AccountPrimitives>> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as Record<string, AccountPrimitives>;
    } catch (error) {
      const isMissingFile = (error as NodeJS.ErrnoException).code === 'ENOENT';
      if (isMissingFile) return {};
      throw error;
    }
  }
}
