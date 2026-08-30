/**
 * CAPA: dominio compartido.
 *
 * Base de todos los errores DE NEGOCIO. Fíjate que NO extiende `Error`:
 * estos no son excepciones, son respuestas esperadas ("no hay fondos",
 * "la cuenta no existe") que viajan dentro de un `Either`.
 *
 * Cada error lleva un `code` estable. La capa HTTP lo usará para elegir el
 * status (404, 422...), pero ESTE archivo no sabe nada de HTTP: el dominio
 * no conoce el mecanismo de entrega.
 *
 * Regla práctica que seguimos en todo el proyecto:
 *   - Fallo de NEGOCIO (culpa del usuario/los datos)  -> Either<DomainError, ...>
 *   - Bug del PROGRAMADOR (estado imposible)          -> throw new Error(...)
 */
export abstract class DomainError {
  abstract readonly code: string;

  constructor(readonly message: string) {}
}
