/**
 * CAPA: dominio compartido.
 *
 * `Either<L, R>` representa el resultado de una operación que puede fallar:
 *   - `Left<L>`  = falló, y `error` te dice EXACTAMENTE por qué (tipado).
 *   - `Right<R>` = salió bien, y `value` trae el resultado.
 *
 * ¿Por qué no lanzar excepciones? Porque un retiro sin fondos NO es un error
 * inesperado del programa: es una respuesta de negocio normal. Al devolverla
 * en el tipo de retorno, el compilador OBLIGA a quien llama a manejarla.
 *
 * Nota vs. el `Result` del repo utp: aquí el error y el valor viven en campos
 * distintos (`error` / `value`) y con tipos distintos. En utp ambos viajaban
 * en `value: T`, así que el compilador no podía distinguir éxito de fracaso.
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  constructor(readonly error: L) {}

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }
}

export class Right<L, R> {
  constructor(readonly value: R) {}

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }
}

export const left = <L, R = never>(error: L): Either<L, R> => new Left(error);
export const right = <L = never, R = unknown>(value: R): Either<L, R> => new Right(value);
