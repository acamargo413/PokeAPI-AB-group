# Pokémon API

API REST desarrollada con **Node.js, TypeScript, Express y PostgreSQL**, integrada con la **PokéAPI** para consultar información de Pokémon.

El proyecto incluye un frontend web para consultar Pokémon, buscar por nombre o ID, filtrar por tipo, visualizar información detallada y administrar colecciones y Pokémon favoritos.

## Tecnologías

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- PokéAPI
- HTML
- CSS
- JavaScript / TypeScript
- Git y GitHub

## Estructura del proyecto

```text
pokemon-api/
├── components/
│   ├── main.ts
│   ├── pokemonAbilities.ts
│   ├── pokemonEvolution.ts
│   ├── pokemonHeader.ts
│   └── pokemonStats.ts
│
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── testDatabase.ts
│   │
│   ├── controllers/
│   │   ├── pokemon.controller.ts
│   │   ├── collection.controller.ts
│   │   └── favorite.controller.ts
│   │
│   ├── routes/
│   │   ├── pokemon.routes.ts
│   │   ├── collection.routes.ts
│   │   └── favorite.routes.ts
│   │
│   ├── services/
│   │   ├── pokemon.service.ts
│   │   ├── collection.service.ts
│   │   └── favorite.service.ts
│   │
│   └── app.ts
│
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## Funcionalidades

### Pokémon

- Listado de Pokémon.
- Búsqueda por nombre o ID.
- Filtro por tipo.
- Paginación.
- Visualización de información detallada.
- Estadísticas base.
- Habilidades.
- Evoluciones.
- Integración con PokéAPI.

### Colecciones

Los usuarios pueden:

- Crear colecciones.
- Consultar sus colecciones.
- Actualizar colecciones.
- Eliminar colecciones.
- Asociar Pokémon favoritos a una colección.

### Favoritos

- Agregar Pokémon a una colección.
- Consultar los Pokémon favoritos de una colección.
- Eliminar Pokémon favoritos.
- Validación de la colección antes de guardar un favorito.

## Seguridad multiempresa

El sistema implementa aislamiento de información entre organizaciones.

Se crearon organizaciones ficticias para realizar las pruebas:

- Organización Alpha
- Organización Beta

Cada organización puede tener sus propias colecciones y favoritos.

El sistema utiliza `organizationId` para asociar la información con una organización y evitar que una organización consulte o modifique los datos pertenecientes a otra.

Por ejemplo:

```text
Organización Alpha
└── Colección Alpha
    ├── Pikachu
    └── Charizard

Organización Beta
└── Colección Beta
    ├── Bulbasaur
    └── Squirtle
```

Las consultas y operaciones de colecciones y favoritos validan la organización correspondiente.

> Nota: este proyecto implementa la separación multiempresa como parte del ejercicio técnico. En un sistema de producción, el `organizationId` debería obtenerse desde una sesión autenticada o token JWT, en lugar de confiar directamente en un valor enviado por el cliente.

## Base de datos

El proyecto utiliza **PostgreSQL**.

Base de datos:

```text
pokemon_api
```

Las principales entidades utilizadas son:

- `organizations`
- `users`
- `collections`
- `favorites`

La relación entre organizaciones y colecciones permite mantener los datos separados:

```text
organizations
      │
      └── collections
              │
              └── favorites
```

## Configuración

En:

```text
src/config/database.ts
```

se configura la conexión a PostgreSQL.

Ejemplo:

```ts
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "pokemon_api",
  user: "postgres",
  password: "TU_PASSWORD",
});
```

Se recomienda utilizar variables de entorno para las credenciales en un entorno real.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/acmargo413/PokeAPI-AB-group.git
```

Entrar al proyecto:

```bash
cd PokeAPI-AB-group
```

Instalar dependencias:

```bash
npm install
```

## Configurar PostgreSQL

Crear una base de datos llamada:

```text
pokemon_api
```

Configurar las credenciales de PostgreSQL en:

```text
src/config/database.ts
```

## Ejecutar en desarrollo

Para ejecutar el proyecto directamente con TypeScript:

```bash
npm run dev
```

El servidor estará disponible en:

```text
http://localhost:3000
```

## Compilar el proyecto

```bash
npm run build
```

Los archivos compilados se generan dentro de:

```text
dist/
```

## Ejecutar la versión compilada

```bash
npm start
```

El servidor se ejecutará en:

```text
http://localhost:3000
```

## Endpoints principales

### Pokémon

```http
GET /api/pokemon
```

Obtiene la lista de Pokémon.

```http
GET /api/pokemon/:id
```

Obtiene un Pokémon por ID.

```http
GET /api/pokemon/search?name=pikachu
```

Busca un Pokémon por nombre.

### Colecciones

```http
POST /api/collections
```

Crear una colección.

```http
GET /api/collections?organizationId=1
```

Obtener las colecciones de una organización.

```http
PUT /api/collections/:id
```

Actualizar una colección.

```http
DELETE /api/collections/:id?organizationId=1
```

Eliminar una colección.

### Favoritos

```http
POST /api/collections/:collectionId/favorites
```

Agregar un Pokémon favorito.

```http
GET /api/collections/:collectionId/favorites?organizationId=1
```

Obtener los favoritos de una colección.

```http
DELETE /api/collections/:collectionId/favorites/:pokemonId?organizationId=1
```

Eliminar un Pokémon favorito.

## Arquitectura

El backend utiliza una arquitectura separada por responsabilidades:

```text
Request
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
PostgreSQL
```

### Routes

Definen los endpoints disponibles de la API.

### Controllers

Reciben las solicitudes HTTP, validan los datos y generan las respuestas.

### Services

Contienen la lógica relacionada con el acceso y manipulación de los datos.

### Config

Contiene la configuración de conexión con PostgreSQL.

## Flujo de favoritos

```text
Frontend
   │
   │ POST /api/collections/:id/favorites
   ▼
Favorite Controller
   │
   ▼
Favorite Service
   │
   ▼
PostgreSQL
   │
   ▼
Favorite
```

Antes de guardar el favorito, el backend verifica que la colección pertenezca a la organización indicada.

## Pruebas realizadas

Se verificó:

- Conexión con PostgreSQL.
- Consulta de Pokémon.
- Búsqueda de Pokémon.
- Filtrado.
- Paginación.
- Creación de colecciones.
- Actualización de colecciones.
- Eliminación de colecciones.
- Creación de favoritos.
- Consulta de favoritos.
- Eliminación de favoritos.
- Separación de datos entre organizaciones.
- Compilación TypeScript.
- Ejecución del servidor.
- Funcionamiento del frontend.

## Ejecución rápida

Después de instalar las dependencias y configurar PostgreSQL:

```bash
npm run build
npm start
```

Abrir:

```text
http://localhost:3000
```

## Autor

**Andres Camargo**

Proyecto desarrollado como ejercicio técnico utilizando Node.js, TypeScript, Express, PostgreSQL y PokéAPI.