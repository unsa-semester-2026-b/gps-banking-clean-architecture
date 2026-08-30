/**
 * La "regla de la dependencia" de Clean Architecture, pero EJECUTABLE.
 *
 * En los mejores equipos la arquitectura no es una convención que se explica
 * en una wiki: es una regla que el CI verifica. Si alguien importa Sequelize
 * dentro del dominio, este comando falla:
 *
 *   npm run test:arch
 */
module.exports = {
  forbidden: [
    {
      name: 'dominio-no-depende-de-nadie',
      comment:
        'El dominio es el centro: no puede importar aplicación, infraestructura, ' +
        'el arranque de la app ni librerías externas (express, sequelize, nestjs...).',
      severity: 'error',
      from: { path: '(^src/modules/[^/]+/domain|^src/shared/domain)' },
      to: {
        path: '(^src/modules/[^/]+/(application|infrastructure)|^src/app|node_modules)',
      },
    },
    {
      name: 'aplicacion-no-depende-de-infraestructura',
      comment:
        'Los casos de uso hablan con interfaces (puertos), nunca con implementaciones ' +
        'concretas (Express, base de datos, S3, pdfmake...).',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application' },
      to: { path: '(^src/modules/[^/]+/infrastructure|^src/app|node_modules)' },
    },
    {
      name: 'nada-depende-del-arranque',
      comment: 'src/app compone todo; nadie debe importar desde ahí.',
      severity: 'error',
      from: { path: '^src/modules' },
      to: { path: '^src/app' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
