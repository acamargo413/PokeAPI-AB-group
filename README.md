# Pokémon Explorer API

Aplicación web desarrollada como ejercicio técnico para consultar información de Pokémon mediante la PokéAPI, utilizando un backend propio con Node.js, TypeScript y Express, además de PostgreSQL para la persistencia de colecciones y Pokémon favoritos.

## Tecnologías

- Node.js
- TypeScript
- Express
- PostgreSQL
- HTML
- CSS
- JavaScript/TypeScript en frontend
- PokéAPI
- Git y GitHub

## Funcionalidades

### Pokémon

- Listado de Pokémon.
- Paginación.
- Búsqueda por nombre.
- Filtro por tipo.
- Consulta de información detallada.
- Tipos de Pokémon.
- Habilidades.
- Estadísticas.
- Cadena de evolución.
- Manejo de errores cuando el Pokémon no existe.

### Backend

API REST propia desarrollada con Express y TypeScript.

Endpoints principales:

```text
GET    /api/pokemon
GET    /api/pokemon/:id
GET    /api/pokemon/search?name=pikachu
GET    /api/pokemon?page=1&limit=10
GET    /api/pokemon?page=1&limit=10&type=fire
```

### Colecciones

Permite crear y administrar colecciones de Pokémon.

```text
POST   /api/collections
GET    /api/collections
PUT    /api/collections/:id
DELETE /api/collections/:id
```

### Favoritos

Permite guardar Pokémon dentro de una colección utilizando PostgreSQL.

```text
POST   /api/collections/:collectionId/favorites
GET    /api/collections/:collectionId/favorites
DELETE /api/collections/:collectionId/favorites/:pokemonId
```

## Base de datos

El proyecto utiliza PostgreSQL con una base de datos llamada:

```text
pokemon_api
```

Tablas principales:

```text
collections
favorites
```

La tabla `favorites` está relacionada con `collections`, por lo que los favoritos pertenecientes a una colección se eliminan automáticamente cuando se elimina dicha colección.

## Estructura del proyecto

```text
pokemon-api/
│
├── components/
│   └── main.ts
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

## Configuración de PostgreSQL

Crear una base de datos llamada:

```text
pokemon_api
```

Crear las tablas:

```sql
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    pokemon_id INTEGER NOT NULL,
    pokemon_name VARCHAR(100) NOT NULL,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Configurar las credenciales de PostgreSQL en:

```text
src/config/database.ts
```

## Ejecutar el proyecto

Compilar TypeScript:

```bash
npx tsc
```

Iniciar el backend:

```bash
npx tsx src/app.ts
```

El backend estará disponible en:

```text
http://localhost:3000
```

En otra terminal, iniciar el frontend:

```bash
npx serve -l 5500 .
```

Abrir en el navegador:

```text
http://localhost:5500
```

## Flujo de funcionamiento

```text
Frontend
   │
   ▼
Backend Express
   │
   ├── Pokémon
   │      │
   │      ▼
   │   PokéAPI
   │
   └── Colecciones / Favoritos
          │
          ▼
      PostgreSQL
```

El frontend consume la API propia del proyecto. El backend se encarga de consultar la PokéAPI y de gestionar la persistencia de colecciones y favoritos en PostgreSQL.

## Autor

Andres Camargo

Ingeniería de Sistemas