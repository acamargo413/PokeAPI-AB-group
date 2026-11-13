# Pokémon API

API REST desarrollada con **Node.js, TypeScript y Express**, que consume la [PokéAPI](https://pokeapi.co/) para consultar información de Pokémon.

## Tecnologías

- Node.js
- TypeScript
- Express
- PokéAPI
- HTML
- CSS
- JavaScript/TypeScript

## Funcionalidades

- Listar Pokémon.
- Buscar Pokémon por nombre.
- Filtrar Pokémon por tipo.
- Paginación.
- Consultar detalles de un Pokémon.
- Mostrar tipos, habilidades y estadísticas.
- Mostrar cadena de evolución.
- Manejo de errores.
- Caché de consultas.

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/acamargo413/PokeAPI-AB-group.git
cd PokeAPI-AB-group
```

Instalar dependencias:

```bash
npm install
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

En otra terminal, ejecutar el frontend:

```bash
npx serve -l 5500 .
```

Abrir en el navegador:

```text
http://localhost:5500
```

## Endpoints

### Obtener Pokémon

```text
GET /api/pokemon
```

### Obtener Pokémon por ID o nombre

```text
GET /api/pokemon/:id
```

Ejemplo:

```text
GET /api/pokemon/pikachu
```

### Buscar Pokémon

```text
GET /api/pokemon/search?name=pikachu
```

### Filtrar por tipo

```text
GET /api/pokemon?type=fire&page=1&limit=10
```

## Estructura

```text
pokemon-api/
├── components/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── app.ts
├── index.html
├── package.json
└── tsconfig.json
```

## Autor

**Andres Camargo**

Proyecto realizado como ejercicio de desarrollo de una API REST con TypeScript y Express.
