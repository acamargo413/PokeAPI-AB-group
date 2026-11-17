# Pokémon API

API REST desarrollada en **TypeScript + Node.js + Express**, integrada con **PokéAPI** y **PostgreSQL**.

El proyecto incluye un frontend web para consultar Pokémon, buscar por nombre, filtrar por tipo, visualizar estadísticas, habilidades y evoluciones, además de gestionar colecciones y Pokémon favoritos.

---

## Tecnologías utilizadas

- TypeScript
- Node.js
- Express
- PostgreSQL
- PokéAPI
- Vitest
- Supertest
- JSDOM
- HTML
- CSS
- JavaScript/TypeScript
- Git y GitHub

---

## Funcionalidades

### Pokémon

- Listado de Pokémon.
- Paginación.
- Búsqueda por nombre.
- Filtro por tipo.
- Consulta de detalles.
- Estadísticas base.
- Habilidades.
- Imagen.
- Cadena de evolución.

### Colecciones

- Crear colecciones.
- Consultar colecciones.
- Actualizar colecciones.
- Eliminar colecciones.
- Asociar Pokémon favoritos a colecciones.

### Favoritos

- Agregar Pokémon a una colección.
- Consultar favoritos.
- Eliminar favoritos.

### Seguridad multiempresa

El sistema implementa separación de información mediante organizaciones.

Se crearon organizaciones ficticias para realizar las pruebas:

- Organización Alpha
- Organización Beta
- ACME
- POKEMON COLOMBIA

Cada colección pertenece a una organización mediante `organization_id`.

Las consultas y operaciones sobre colecciones y favoritos validan la organización correspondiente, evitando que una organización pueda consultar o modificar información perteneciente a otra.

> Para el ejercicio académico, `organizationId` se utiliza como identificador de organización enviado por la aplicación. En un sistema productivo debería obtenerse desde un usuario autenticado mediante sesión o JWT.

---

# Herramientas para un agente IA

El proyecto expone tres herramientas preparadas para ser utilizadas por un agente de IA:

- `search_pokemon`
- `get_pokemon_details`
- `compare_pokemon`

Cada herramienta:

- Valida sus parámetros.
- Devuelve respuestas en formato JSON estructurado.
- Maneja errores.
- Puede ejecutarse mediante un simulador de llamadas.
- Puede ser utilizada mediante los endpoints de herramientas.

### search_pokemon

Permite buscar un Pokémon por nombre.

Ejemplo de parámetros:

```json
{
  "name": "pikachu"
}
```

Endpoint:

```text
POST /api/tools/search
```

---

### get_pokemon_details

Permite obtener la información completa de un Pokémon utilizando su nombre o ID.

Ejemplo:

```json
{
  "id": 25
}
```

Endpoint:

```text
POST /api/tools/details
```

---

### compare_pokemon

Permite comparar dos Pokémon diferentes.

Ejemplo:

```json
{
  "pokemon1": "pikachu",
  "pokemon2": "charizard"
}
```

Endpoint:

```text
POST /api/tools/compare
```

La respuesta contiene información de ambos Pokémon, incluyendo:

- ID.
- Nombre.
- Tipos.
- Estadísticas.

### Simulador de herramientas

Las herramientas pueden probarse mediante:

```text
src/tools/tool-simulator.ts
```

El simulador ejecuta ejemplos de:

```text
search_pokemon
get_pokemon_details
compare_pokemon
```

y muestra las respuestas estructuradas en JSON.

---

# Pruebas automatizadas

El proyecto implementa tres tipos de pruebas:

## 1. Pruebas unitarias

Herramienta:

**Vitest**

Se prueba el servicio de Pokémon de forma aislada.

Actualmente se comprueba:

- Transformación correcta de la respuesta de PokéAPI.
- Manejo del error cuando un Pokémon no existe.
- Transformación de tipos.
- Transformación de habilidades.
- Transformación de estadísticas.
- Transformación de evoluciones.

Las respuestas de PokéAPI se simulan mediante `fetch`, por lo que las pruebas no dependen del servicio real.

Archivo:

```text
tests/unit/pokemon.service.test.ts
```

Las herramientas del agente IA también cuentan con pruebas unitarias:

```text
tests/unit/tools.test.ts
```

Estas pruebas verifican:

- Validación de parámetros.
- Búsqueda correcta.
- Consulta de detalles.
- Comparación de Pokémon.
- Manejo de Pokémon repetidos.
- Respuestas estructuradas.

---

## 2. Pruebas de integración

Herramientas:

- Vitest
- Supertest

Se prueba la API de Express utilizando sus rutas reales.

Actualmente se comprueba:

```text
GET /api/pokemon
```

La respuesta de PokéAPI también se simula para evitar depender de Internet.

Archivo:

```text
tests/integration/pokemon.routes.test.ts
```

---

## 3. Pruebas de interfaz

Herramientas:

- Vitest
- JSDOM

Se carga el `index.html` dentro de un DOM simulado y se comprueba que existan los principales elementos de la interfaz:

- Buscador.
- Filtro por tipo.
- Botón de búsqueda.
- Lista de resultados.
- Paginación.
- Panel de detalles.
- Sección de colecciones.

Archivo:

```text
tests/interface/main.test.ts
```

---

## Ejecutar las pruebas

Para ejecutar todas las pruebas:

```bash
npm test
```

Para ejecutar Vitest en modo watch:

```bash
npm run test:watch
```

El proyecto debe mostrar todas las pruebas exitosas antes de realizar una entrega.

---

# Instalación

Clonar el repositorio:

```bash
git clone https://github.com/acmargo413/PokeAPI-AB-group.git
```

Entrar al proyecto:

```bash
cd pokemon-api
```

Instalar dependencias:

```bash
npm install
```

---

# Base de datos

El proyecto utiliza PostgreSQL.

Base de datos:

```text
pokemon_api
```

Configuración utilizada por el backend:

```text
Host: localhost
Puerto: 5432
Usuario: postgres
Base de datos: pokemon_api
```

La configuración se encuentra en:

```text
src/config/database.ts
```

---

# Ejecución en desarrollo

Para iniciar el proyecto:

```bash
npm run dev
```

El servidor queda disponible en:

```text
http://localhost:3000
```

---

# Compilar el proyecto

```bash
npm run build
```

Los archivos compilados se generan dentro de:

```text
dist/
```

Para iniciar la versión compilada:

```bash
npm start
```

---

# Estructura del proyecto

```text
pokemon-api/
│
├── components/
│   ├── pokemonAbilities.ts
│   ├── pokemonEvolution.ts
│   ├── pokemonHeader.ts
│   ├── pokemonStats.ts
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
│   │   ├── favorite.routes.ts
│   │   └── tools.routes.ts
│   │
│   ├── services/
│   │   ├── pokemon.service.ts
│   │   ├── collection.service.ts
│   │   └── favorite.service.ts
│   │
│   ├── tools/
│   │   ├── search-pokemon.tool.ts
│   │   ├── get-pokemon-details.tool.ts
│   │   ├── compare-pokemon.tool.ts
│   │   └── tool-simulator.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── unit/
│   │   ├── pokemon.service.test.ts
│   │   └── tools.test.ts
│   │
│   ├── integration/
│   │   └── pokemon.routes.test.ts
│   │
│   └── interface/
│       └── main.test.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

# API

## Obtener Pokémon

```text
GET /api/pokemon/:id
```

Ejemplo:

```text
GET /api/pokemon/25
```

---

## Listar Pokémon

```text
GET /api/pokemon
```

---

## Buscar Pokémon

```text
GET /api/pokemon/search?name=pikachu
```

---

## Filtrar por tipo

```text
GET /api/pokemon?page=1&limit=20&type=electric
```

---

## Colecciones

```text
POST   /api/collections
GET    /api/collections?organizationId=1
PUT    /api/collections/:id
DELETE /api/collections/:id?organizationId=1
```

---

## Favoritos

```text
POST   /api/collections/:collectionId/favorites
GET    /api/collections/:collectionId/favorites?organizationId=1
DELETE /api/collections/:collectionId/favorites/:pokemonId?organizationId=1
```

---

## Herramientas IA

### Buscar Pokémon

```text
POST /api/tools/search
```

Body:

```json
{
  "name": "pikachu"
}
```

### Obtener detalles

```text
POST /api/tools/details
```

Body:

```json
{
  "id": 25
}
```

### Comparar Pokémon

```text
POST /api/tools/compare
```

Body:

```json
{
  "pokemon1": "pikachu",
  "pokemon2": "charizard"
}
```
# Integración con ElevenLabs

El proyecto incluye una integración con **ElevenLabs** para realizar llamadas telefónicas de prueba desde la aplicación.

La integración permite ejecutar una llamada directamente desde el frontend mediante un botón.

## Funcionamiento

El flujo de la llamada es:

```text
Frontend
   ↓
Backend Node.js / Express
   ↓
API de ElevenLabs
   ↓
Llamada telefónica
```

Desde la aplicación se ingresa el número de destino y se presiona el botón:

```text
Realizar llamada
```

El backend procesa la solicitud y utiliza la API de ElevenLabs para iniciar la llamada.

## Prueba

La integración fue probada realizando una llamada real de prueba hacia un número telefónico configurado.

La llamada fue recibida correctamente.

## Configuración

Las credenciales de ElevenLabs deben mantenerse únicamente en el backend y no deben exponerse directamente en el frontend.

Las variables utilizadas para la integración deben configurarse mediante variables de entorno.

> Las credenciales reales de ElevenLabs no deben almacenarse directamente en el repositorio.

## Documentación estudiada

Durante el desarrollo se revisó la documentación de:

- ElevenLabs API.
- Integración de llamadas.
- Configuración de agentes.
- Parámetros necesarios para realizar llamadas de prueba.
- NextVoice / NexterVoice.

La integración con ElevenLabs se realizó utilizando el endpoint correspondiente para llamadas de prueba.
---

# Mock de PokéAPI

Las pruebas automatizadas utilizan mocks para simular las respuestas de PokéAPI.

Esto permite ejecutar las pruebas sin depender de:

- Disponibilidad de PokéAPI.
- Conexión a Internet.
- Cambios en las respuestas del servicio externo.
- Tiempo de respuesta del servicio externo.

De esta forma, las pruebas pueden ejecutarse de manera controlada y reproducible.

---

# Autor

Proyecto desarrollado como ejercicio técnico utilizando TypeScript, Node.js, Express, PostgreSQL y PokéAPI.

**Andrés Camargo**