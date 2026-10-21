# Bolsa de Empleo Santa Catarina — Web

Frontend de la bolsa de empleo municipal, con Angular 22, TypeScript y Bootstrap. Incluye consulta pública de vacantes, acceso de empresas y administración de empleos, empresas, moderación, usuarios y roles.

## Requisitos

- Node.js 24 y npm.
- API de Bolsa de Empleo Santa Catarina accesible desde el navegador.

## Ejecutar localmente

```powershell
npm ci
npm start
```

La web se abre en `http://localhost:4200`. La configuración inicial apunta al backend local en `http://localhost:8080/api/v1`.

Rutas principales:

- `/jobs`: vacantes públicas vigentes.
- `/login`: inicio de sesión.
- `/register-company`: registro de empresas.
- `/admin`: tablero.
- `/admin/empleos`: gestión de vacantes.
- `/admin/empresas`: gestión de empresas para administradores.
- `/admin/moderation`: revisión de empresas y vacantes.

## Compilar y probar

```powershell
npm test -- --watch=false
npm run build
```

La compilación para hosting estático queda en `dist/seed-frontend/browser/`.

## Configuración para hosting

1. Cambia `apiBaseUrl` en `src/enviroment/environment.ts` por la URL HTTPS pública de la API, incluyendo `/api/v1`.
2. Configura `CORS_ORIGINS` en el backend con el dominio de esta web.
3. Ajusta la URL canónica en `src/index.html` al dominio final.
4. Configura el hosting para servir `index.html` cuando se acceda directamente a rutas de Angular.

El código del navegador es público: no agregues contraseñas SMTP, claves JWT privadas ni credenciales de base de datos a esta aplicación. Esos valores se configuran exclusivamente en el backend.

Repositorio de la API: https://github.com/MauricioCristan/BolsaTrabajoSCAPI

No se incluyen `node_modules`, compilaciones, archivos locales, respaldos ni secretos en este repositorio.
