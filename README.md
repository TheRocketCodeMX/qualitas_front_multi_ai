# qualitas_front_multi_ai
Aplicación frontend desarrollada para el proyecto de Qualitas Multicotizador

## Configuración

### Variables de Entorno

El proyecto utiliza variables de entorno para configurar las URLs de las APIs. Copia el archivo `env.example` a `.env.local` y configura las siguientes variables:

```env
# API URLs
NEXT_PUBLIC_ACCOUNT_API_URL=http://localhost:8081/account-api
NEXT_PUBLIC_COTIZACION_API_URL=http://localhost:8080/cotizacion-api
```

### Configuración Centralizada

La aplicación utiliza un sistema de configuración centralizada ubicado en `lib/config.ts` que maneja:

- URLs base de las APIs
- Endpoints específicos para cada servicio
- Funciones helper para construir URLs completas

### APIs Configuradas

1. **Account API** (Puerto 8081)
   - Autenticación de usuarios
   - Gestión de contraseñas
   - Endpoints de login y reset de contraseña

2. **Cotización API** (Puerto 8080)
   - Cotización masiva
   - Carga de archivos Excel
   - Consulta de estados de lotes

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm dev
```

## Construcción

```bash
pnpm build
```
