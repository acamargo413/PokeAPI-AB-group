# Pokémon API

API REST desarrollada con **TypeScript + Node.js + Express**, integrada con **PokéAPI** y **PostgreSQL**.

El proyecto incluye un frontend web para consultar Pokémon, buscar por nombre, filtrar por tipo, visualizar estadísticas, habilidades y evoluciones, además de gestionar colecciones y Pokémon favoritos.

También incorpora herramientas para agentes de IA, un sistema RAG para consultar información actual de Pokémon y una integración con ElevenLabs para realizar consultas mediante llamadas telefónicas.

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
- JavaScript / TypeScript
- ElevenLabs
- Git y GitHub
- pnpm

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

Endpoint:

```text
POST /api/tools/search
```

Ejemplo:

```json
{
  "name": "pikachu"
}
```

### get_pokemon_details

Permite obtener la información completa de un Pokémon utilizando su nombre o ID.

Endpoint:

```text
POST /api/tools/details
```

Ejemplo:

```json
{
  "id": 25
}
```

### compare_pokemon

Permite comparar dos Pokémon diferentes.

Endpoint:

```text
POST /api/tools/compare
```

Ejemplo:

```json
{
  "pokemon1": "pikachu",
  "pokemon2": "charizard"
}
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

- `search_pokemon`
- `get_pokemon_details`
- `compare_pokemon`

y muestra las respuestas estructuradas en JSON.

---

# RAG de Pokémon

El proyecto incorpora un sistema RAG para consultar información actual de Pokémon.

El RAG actual no utiliza una base de datos vectorial ni embeddings. Su función consiste en obtener información actual mediante las herramientas internas del proyecto y construir un contexto estructurado para la consulta.

### Flujo

```text
Consulta del usuario
        ↓
/api/rag/query
        ↓
buscar información del Pokémon
        ↓
/api/tools/details
        ↓
PokéAPI
        ↓
Construcción del contexto
        ↓
Respuesta RAG
```

### Endpoint RAG

```text
POST /api/rag/query
```

Ejemplo:

```json
{
  "consulta": "pikachu"
}
```

La respuesta contiene información estructurada como:

- Nombre.
- ID.
- Tipos.
- Habilidades.
- HP.
- Ataque.
- Defensa.
- Ataque especial.
- Defensa especial.
- Velocidad.
- Evolución.

Ejemplo de respuesta:

```json
{
  "success": true,
  "consulta": "pikachu",
  "contexto": "Información del Pokémon..."
}
```

## Consulta visual y configuración de fuentes

La página principal incluye una sección **Consulta visual de Pokémon**. La fuente predeterminada consulta el RAG de Pokémon existente y presenta el contexto en una ficha con imagen, tipos, estadísticas, habilidades y evolución.

En **Fuentes de datos** se pueden agregar otras fuentes sin editar el código:

### API REST

1. Escribe un nombre para la fuente y selecciona **API REST**.
2. Ingresa una URL que incluya `{query}` en el lugar donde se insertará el texto buscado.
3. Selecciona `GET` o `POST`. Los headers se pueden ingresar como un objeto JSON.
4. Pulsa **Agregar fuente**, selecciónala en **Consultar fuente**, escribe una búsqueda y pulsa **Consultar RAG**.

Para `POST`, la consulta también se envía en el cuerpo como `{"query":"texto buscado"}`. La respuesta debe ser JSON. Cuando incluye una lista en `results`, `resultados`, `items`, `data` o `characters`, la interfaz presenta hasta 12 elementos como tarjetas; otras estructuras se muestran como JSON.

Ejemplo con [Rick and Morty API](https://rickandmortyapi.com/documentation):

```text
Nombre: Rick and Morty
Tipo: API REST
URL: https://rickandmortyapi.com/api/character/?name={query}
Método: GET
Headers: (vacío)
Consulta: Morty
```

Las APIs se consultan directamente desde el navegador, por lo que deben permitir CORS. La configuración se guarda en el almacenamiento local del navegador. No guardes secretos o credenciales privadas en los headers: esta integración de frontend no los protege.

### Biblioteca de documentos RAG

La sección **Biblioteca de documentos** muestra los grupos creados y los archivos que contiene cada uno. Al cargar uno o varios archivos, se puede elegir un grupo existente o escribir el nombre de uno nuevo. El menú **Documentos a consultar**, junto al buscador, permite elegir un grupo o consultar todos los documentos.

Acciones disponibles:

- **Crear:** subir un archivo e incorporarlo como contexto.
- **Crear grupo:** escribir un nombre nuevo al cargar los primeros archivos.
- **Agregar archivos:** seleccionar un grupo existente y cargar más archivos en él.
- **Renombrar o eliminar grupo:** estas acciones aplican a todos los archivos del grupo.
- **Leer:** revisar el contenido completo desde **Editar**.
- **Actualizar:** cambiar el nombre o editar el texto extraído.
- **Reemplazar:** conservar el documento y sustituir su contenido por el de otro archivo.
- **Eliminar:** quitar un documento de la biblioteca.

Se admiten TXT, Markdown, JSON, CSV y Excel `.xlsx` (primera hoja). CSV y XLSX se convierten a texto estructurado antes de guardarse. Los archivos se envían al backend y se almacenan en `data/rag-contexts.json`, que está excluido de Git. Los archivos pueden tener hasta 8 MB.

Endpoints de administración:

```text
GET    /api/rag/contexts
GET    /api/rag/contexts/:id
POST   /api/rag/contexts
PUT    /api/rag/contexts/:id
DELETE /api/rag/contexts/:id
GET    /api/rag/context-groups
PUT    /api/rag/context-groups/:name
DELETE /api/rag/context-groups/:name
POST   /api/rag/contexts/query
```

En cada consulta, la aplicación puede combinar la fuente principal elegida (RAG Pokémon o una API configurada) con los archivos del grupo seleccionado. Para documentos, se buscan términos en el texto y se muestran hasta cinco fragmentos por archivo. Este mecanismo es búsqueda textual; no crea embeddings ni una base vectorial.

### Alcance de estas fuentes

Las fuentes API se guardan en el almacenamiento local del navegador; los documentos se guardan en el servidor. La consulta de documentos realiza búsqueda textual, mientras que la API configurada responde a la consulta que recibe. Esta vista no crea embeddings ni una base vectorial; el RAG de Pokémon existente sigue usando su propio endpoint y flujo.

---

# Integración RAG + ElevenLabs

El proyecto integra el RAG con **ElevenLabs Conversational AI**.

Esto permite que el agente de voz consulte información de Pokémon durante una llamada telefónica.

La herramienta utilizada en ElevenLabs se llama:

```text
buscar_pokemon
```

La herramienta utiliza un webhook que apunta al endpoint:

```text
/api/rag/query
```

## Flujo completo

```text
Llamada telefónica
        ↓
ElevenLabs
        ↓
Herramienta buscar_pokemon
        ↓
Webhook RAG
        ↓
Cloudflare Tunnel
        ↓
API Node.js / Express
        ↓
/api/rag/query
        ↓
/api/tools/details
        ↓
PokéAPI
        ↓
Contexto RAG
        ↓
ElevenLabs
        ↓
Respuesta por voz
```

## Prueba realizada

La integración fue probada mediante una llamada telefónica real.

Durante las pruebas, el agente fue capaz de responder consultas sobre:

- Estadísticas de Pikachu.
- Habilidades de Charizard.
- Evolución de Charmander.

Esto confirma la comunicación entre ElevenLabs, el webhook RAG, el backend y PokéAPI.

> La URL de Cloudflare utilizada durante el desarrollo corresponde a un Quick Tunnel y puede cambiar cuando el túnel se reinicia. No debe tratarse como una URL permanente de producción.

---

# Integración con ElevenLabs

El proyecto incluye una integración con **ElevenLabs** para realizar llamadas telefónicas desde el backend.

La integración permite ejecutar una llamada desde la aplicación y enviar información temporal para personalizar el comportamiento del agente durante la llamada.

## Endpoint de llamada

```text
POST /api/elevenlabs/test-call
```

El backend recibe información como:

- `toNumber`
- `temporaryPrompt`
- `temporaryFirstMessage`

Ejemplo:

```json
{
  "toNumber": "+573001234567",
  "temporaryPrompt": "Atiende al usuario de forma cordial.",
  "temporaryFirstMessage": "Hola, ¿cómo estás?"
}
```

El backend se comunica con ElevenLabs manteniendo las credenciales fuera del frontend.

## Configuración

Las credenciales deben mantenerse únicamente en el backend mediante variables de entorno.

Variables principales utilizadas:

```env
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_PHONE_NUMBER_ID=
RAG_PUBLIC_URL=
```

> Nunca almacenar claves reales de ElevenLabs dentro del repositorio.

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

## Listar Pokémon

```text
GET /api/pokemon
```

## Buscar Pokémon

```text
GET /api/pokemon/search?name=pikachu
```

## Filtrar por tipo

```text
GET /api/pokemon?page=1&limit=20&type=electric
```

## Colecciones

```text
POST   /api/collections
GET    /api/collections?organizationId=1
PUT    /api/collections/:id
DELETE /api/collections/:id?organizationId=1
```

## Favoritos

```text
POST   /api/collections/:collectionId/favorites
GET    /api/collections/:collectionId/favorites?organizationId=1
DELETE /api/collections/:collectionId/favorites/:pokemonId?organizationId=1
```

## Herramientas IA

```text
POST /api/tools/search
POST /api/tools/details
POST /api/tools/compare
```

## RAG

```text
POST /api/rag/query
```

## ElevenLabs

```text
POST /api/elevenlabs/test-call
POST /api/elevenlabs/create-rag-tool
GET  /api/elevenlabs/tools
POST /api/elevenlabs/attach-rag-tool
```

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

Las respuestas de PokéAPI se simulan mediante `fetch`, por lo que estas pruebas no dependen del servicio real.

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

## 2. Pruebas de integración

Herramientas:

- Vitest
- Supertest

Se prueba la API de Express utilizando sus rutas reales.

Actualmente se comprueba:

```text
GET /api/pokemon
```

Archivo:

```text
tests/integration/pokemon.routes.test.ts
```

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

## Ejecutar las pruebas

Para ejecutar todas las pruebas:

```bash
pnpm test
```

Para ejecutar Vitest en modo watch:

```bash
pnpm run test:watch
```

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
pnpm install
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

# Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Ejemplo:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD
DB_NAME=pokemon_api

ELEVENLABS_API_KEY=TU_API_KEY
ELEVENLABS_AGENT_ID=TU_AGENT_ID
ELEVENLABS_PHONE_NUMBER_ID=TU_PHONE_NUMBER_ID

RAG_PUBLIC_URL=TU_URL_PUBLICA_DEL_TUNEL
```

> El archivo `.env` debe permanecer fuera del repositorio.

---

# Ejecución en desarrollo

Para iniciar el proyecto:

```bash
pnpm run dev
```

El servidor queda disponible en:

```text
http://localhost:3000
```

Si se utiliza Cloudflare Quick Tunnel para exponer el RAG:

```bash
cloudflared tunnel --url http://localhost:3000
```

La URL pública generada debe configurarse en:

```env
RAG_PUBLIC_URL=
```

Después de modificar `.env`, reiniciar el backend.

---

# Compilar el proyecto

```bash
pnpm run build
```

Los archivos compilados se generan dentro de:

```text
dist/
```

Para iniciar la versión compilada:

```bash
pnpm start
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
│   ├── rag/
│   │   ├── rag.routes.ts
│   │   └── rag.service.ts
│   │
│   ├── routes/
│   │   ├── pokemon.routes.ts
│   │   ├── collection.routes.ts
│   │   ├── favorite.routes.ts
│   │   ├── tools.routes.ts
│   │   └── elevenlabs.routes.ts
│   │
│   ├── services/
│   │   ├── pokemon.service.ts
│   │   ├── collection.service.ts
│   │   ├── favorite.service.ts
│   │   └── elevenlabs.service.ts
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
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

# Flujo general del sistema

```text
Frontend
   ↓
Node.js + Express
   ↓
Controllers / Services
   ↓
PokéAPI
   ↓
PostgreSQL
```

Para las herramientas IA:

```text
Agente IA
   ↓
Tools
   ↓
PokéAPI
```

Para las consultas RAG mediante voz:

```text
Usuario
   ↓
Llamada telefónica
   ↓
ElevenLabs
   ↓
buscar_pokemon
   ↓
Cloudflare Tunnel
   ↓
/api/rag/query
   ↓
/api/tools/details
   ↓
PokéAPI
   ↓
Contexto RAG
   ↓
ElevenLabs
   ↓
Respuesta por voz
```

---

# Autor

Proyecto desarrollado como ejercicio técnico utilizando:

**TypeScript, Node.js, Express, PostgreSQL, PokéAPI, Vitest, ElevenLabs y herramientas de IA.**

**Andrés Camargo**
