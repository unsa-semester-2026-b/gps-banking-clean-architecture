import { buildContainer } from './container';
import { buildApp } from './server';

/**
 * Punto de entrada: compone las dependencias, arma el servidor y escucha.
 * Fíjate qué corto es: todo el conocimiento está en las capas, no aquí.
 */
const port = Number(process.env.PORT ?? 3000);
const app = buildApp(buildContainer());

app.listen(port, () => {
  console.log(`🏦 Mini banco escuchando en http://localhost:${port}`);
  console.log('');
  console.log('Prueba rápida:');
  console.log(
    `  curl -X POST http://localhost:${port}/api/accounts -H 'Content-Type: application/json' -d '{"holderName":"Ada Lovelace","currency":"PEN"}'`,
  );
  console.log(
    `  curl -X POST http://localhost:${port}/api/accounts/<numero>/deposits -H 'Content-Type: application/json' -d '{"amount":100,"currency":"PEN"}'`,
  );
  console.log(`  curl http://localhost:${port}/api/accounts/<numero>`);
});
