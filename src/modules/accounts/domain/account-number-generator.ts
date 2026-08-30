import { AccountNumber } from './account-number';

/**
 * CAPA: dominio (otro PUERTO).
 *
 * Los puertos no son solo para bases de datos. Generar un número aleatorio
 * también es un detalle de infraestructura: si el caso de uso llamara a
 * `Math.random()` directamente, sus tests serían impredecibles. Con este
 * puerto, en producción inyectamos un generador aleatorio real y en los
 * tests uno fijo y determinista.
 */
export interface AccountNumberGenerator {
  next(): AccountNumber;
}
