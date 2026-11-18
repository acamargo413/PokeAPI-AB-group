const API_URL =
  "http://localhost:3000/api/pokemon";

const COLLECTIONS_URL =
  "http://localhost:3000/api/collections";

const TOOLS_URL =
  "http://localhost:3000/api/tools";

let ORGANIZATION_ID = 1;


const searchInput =
  document.getElementById(
    "search"
  ) as HTMLInputElement;

const typeFilter =
  document.getElementById(
    "typeFilter"
  ) as HTMLSelectElement;

const resultsContainer =
  document.getElementById(
    "results"
  ) as HTMLDivElement;

const paginationContainer =
  document.getElementById(
    "pagination"
  ) as HTMLDivElement;

const detailsContainer =
  document.getElementById(
    "details"
  ) as HTMLDivElement;

const searchButton =
  document.getElementById(
    "searchButton"
  ) as HTMLButtonElement;

const collectionNameInput =
  document.getElementById(
    "collectionName"
  ) as HTMLInputElement;

const createCollectionButton =
  document.getElementById(
    "createCollectionButton"
  ) as HTMLButtonElement;

const collectionsContainer =
  document.getElementById(
    "collections"
  ) as HTMLDivElement;

const limit = 10;


interface Pokemon {
  id?: number;
  name: string;
  image?: string;
  types: string[];
  abilities: string[];
  stats?: Record<string, number>;
  evolution?: string[];
}


interface PokemonListResponse {

  data: {
    name: string;
    url: string;
  }[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


interface Collection {
  id: number;
  name: string;
  organization_id: number;
  created_at: string;
}


interface Favorite {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  collection_id: number;
  created_at: string;
}


/* ==================================================
   OBTENER POKEMON
================================================== */

async function obtenerPokemon(
  nombre: string
): Promise<Pokemon> {

  const response =
    await fetch(
      `${API_URL}/${encodeURIComponent(nombre)}`
    );

  if (response.status === 404) {

    throw new Error(
      "Pokémon no encontrado"
    );
  }

  if (!response.ok) {

    throw new Error(
      "Error del servidor"
    );
  }

  return response.json();
}


/* ==================================================
   BUSCAR POKEMON
================================================== */

async function buscarPokemon(): Promise<void> {

  const nombre =
    searchInput.value
      .trim()
      .toLowerCase();

  if (!nombre) {

    cargarPokemons(1);

    return;
  }

  resultsContainer.innerHTML = `
    <p>
      Buscando Pokémon...
    </p>
  `;

  paginationContainer.innerHTML =
    "";

  try {

    const response =
      await fetch(
        `${API_URL}/search?name=${encodeURIComponent(nombre)}`
      );

    if (response.status === 404) {

      throw new Error(
        "Pokémon no encontrado"
      );
    }

    if (!response.ok) {

      throw new Error(
        "Error del servidor"
      );
    }

    const result =
      await response.json();

    mostrarPokemonBusqueda(
      result.data
    );

  } catch (error) {

    mostrarError(
      error instanceof Error
        ? error.message
        : "No se pudo realizar la búsqueda."
    );
  }
}


/* ==================================================
   MOSTRAR RESULTADO BUSQUEDA
================================================== */

function mostrarPokemonBusqueda(
  pokemon: Pokemon
): void {

  resultsContainer.innerHTML = `

    <div class="pokemon-card">

      <img
        src="${pokemon.image}"
        alt="${pokemon.name}"
      >

      <h3>
        ${pokemon.name}
      </h3>

      <p>
        <strong>Tipos:</strong>
        ${pokemon.types.join(", ")}
      </p>

      <button
        id="searchDetailsButton"
      >
        Ver detalles
      </button>

    </div>

  `;

  const button =
    document.getElementById(
      "searchDetailsButton"
    ) as HTMLButtonElement;

  button.addEventListener(
    "click",
    () => {

      mostrarDetalles(
        pokemon.name
      );

    }
  );
}


/* ==================================================
   ORGANIZACION
================================================== */

function crearSelectorOrganizacion(): void {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.style.marginBottom =
    "20px";

  wrapper.innerHTML = `

    <label
      for="organizationSelect"
    >
      Organización:
    </label>

    <select id="organizationSelect">

      <option value="1">
        Organización Alpha
      </option>

      <option value="2">
        Organización Beta
      </option>

    </select>

  `;

  const select =
    wrapper.querySelector(
      "#organizationSelect"
    ) as HTMLSelectElement;

  select.value =
    String(
      ORGANIZATION_ID
    );

  select.addEventListener(
    "change",
    () => {

      ORGANIZATION_ID =
        Number(
          select.value
        );

      detailsContainer.innerHTML =
        "";

      cargarColecciones();

    }
  );

  collectionsContainer
    .parentElement
    ?.insertBefore(
      wrapper,
      collectionsContainer
    );
}


/* ==================================================
   CARGAR POKEMON
================================================== */

async function cargarPokemons(
  page: number = 1
): Promise<void> {

  resultsContainer.innerHTML = `

    <p>
      Cargando Pokémon...
    </p>

  `;

  try {

    const tipo =
      typeFilter.value;

    let url =
      `${API_URL}?page=${page}&limit=${limit}`;

    if (tipo) {

      url +=
        `&type=${encodeURIComponent(tipo)}`;

    }

    const response =
      await fetch(url);

    if (!response.ok) {

      throw new Error(
        "No se pudieron obtener los Pokémon"
      );
    }

    const result:
      PokemonListResponse =
      await response.json();

    mostrarLista(
      result.data
    );

    mostrarPaginacion(
      result.pagination
    );

  } catch (error) {

    mostrarError(
      error instanceof Error
        ? error.message
        : "Error al cargar los Pokémon."
    );
  }
}


/* ==================================================
   MOSTRAR LISTA
================================================== */

function mostrarLista(
  pokemons:
    PokemonListResponse["data"]
): void {

  resultsContainer.innerHTML =
    "";

  if (
    pokemons.length === 0
  ) {

    resultsContainer.innerHTML = `

      <p>
        No se encontraron Pokémon.
      </p>

    `;

    return;
  }

  pokemons.forEach(
    (pokemon) => {

      const id =
        obtenerIdDesdeUrl(
          pokemon.url
        );

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "pokemon-card";

      card.innerHTML = `

        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png"
          alt="${pokemon.name}"
        >

        <h3>
          ${pokemon.name}
        </h3>

        <button>
          Ver detalles
        </button>

      `;

      const button =
        card.querySelector(
          "button"
        ) as HTMLButtonElement;

      button.addEventListener(
        "click",
        () => {

          mostrarDetalles(
            pokemon.name
          );

        }
      );

      resultsContainer.appendChild(
        card
      );

    }
  );
}


/* ==================================================
   OBTENER ID
================================================== */

function obtenerIdDesdeUrl(
  url: string
): string {

  const partes =
    url.split("/");

  return partes[
    partes.length - 2
  ];
}


/* ==================================================
   PAGINACION
================================================== */

function mostrarPaginacion(
  pagination:
    PokemonListResponse["pagination"]
): void {

  paginationContainer.innerHTML =
    "";

  const anterior =
    document.createElement(
      "button"
    );

  anterior.textContent =
    "Anterior";

  anterior.disabled =
    pagination.page === 1;

  anterior.addEventListener(
    "click",
    () => {

      detailsContainer.innerHTML =
        "";

      cargarPokemons(
        pagination.page - 1
      );

    }
  );

  const pagina =
    document.createElement(
      "span"
    );

  pagina.textContent =
    `Página ${pagination.page} de ${pagination.totalPages}`;

  const siguiente =
    document.createElement(
      "button"
    );

  siguiente.textContent =
    "Siguiente";

  siguiente.disabled =
    pagination.page ===
    pagination.totalPages;

  siguiente.addEventListener(
    "click",
    () => {

      detailsContainer.innerHTML =
        "";

      cargarPokemons(
        pagination.page + 1
      );

    }
  );

  paginationContainer.appendChild(
    anterior
  );

  paginationContainer.appendChild(
    pagina
  );

  paginationContainer.appendChild(
    siguiente
  );
}


/* ==================================================
   DETALLES
================================================== */

async function mostrarDetalles(
  nombre: string
): Promise<void> {

  detailsContainer.innerHTML = `

    <p>
      Cargando información...
    </p>

  `;

  try {

    const pokemon =
      await obtenerPokemon(
        nombre
      );

    detailsContainer.innerHTML = `

      <div class="pokemon-details">

        <h2>
          ${pokemon.name}
        </h2>

        <img
          src="${pokemon.image}"
          alt="${pokemon.name}"
          width="200"
        >

        <p>

          <strong>
            Tipos:
          </strong>

          ${pokemon.types.join(", ")}

        </p>

        <p>

          <strong>
            Habilidades:
          </strong>

          ${pokemon.abilities.join(", ")}

        </p>

        <h3>
          Estadísticas
        </h3>

        <ul>

          ${
            pokemon.stats
              ? Object.entries(
                  pokemon.stats
                )

                  .map(
                    ([nombre, valor]) => `

                      <li>
                        ${nombre}: ${valor}
                      </li>

                    `
                  )

                  .join("")

              : `

                  <li>
                    No disponibles
                  </li>

                `
          }

        </ul>

        <h3>
          Evolución
        </h3>

        <p>

          ${
            pokemon.evolution
              ? pokemon.evolution.join(
                  " → "
                )
              : "No disponible"
          }

        </p>

        <button
          id="favoriteButton"
          class="favorite-button"
        >
          ⭐ Agregar a favoritos
        </button>

        <button id="closeDetails">
          Cerrar detalles
        </button>

        <div id="favoriteMessage"></div>

      </div>

    `;

    const favoriteButton =
      document.getElementById(
        "favoriteButton"
      ) as HTMLButtonElement;

    favoriteButton.addEventListener(
      "click",
      () => {

        mostrarSelectorColeccion(
          pokemon
        );

      }
    );

    const closeButton =
      document.getElementById(
        "closeDetails"
      ) as HTMLButtonElement;

    closeButton.addEventListener(
      "click",
      () => {

        detailsContainer.innerHTML =
          "";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

    detailsContainer.scrollIntoView({
      behavior: "smooth"
    });

  } catch (error) {

    detailsContainer.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "No se pudo obtener la información."
        }

      </p>

    `;

  }
}


/* ==================================================
   SELECTOR DE COLECCION
================================================== */

async function mostrarSelectorColeccion(
  pokemon: Pokemon
): Promise<void> {

  const message =
    document.getElementById(
      "favoriteMessage"
    ) as HTMLDivElement;

  message.innerHTML = `

    <p>
      Cargando colecciones...
    </p>

  `;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "No se pudieron cargar las colecciones"
      );

    }

    const collections:
      Collection[] =
      await response.json();

    if (
      collections.length === 0
    ) {

      message.innerHTML = `

        <p>

          No tienes colecciones.
          Crea una en la sección
          "Mis colecciones".

        </p>

      `;

      return;
    }

    message.innerHTML = `

      <div
        style="margin-top: 15px;"
      >

        <label>
          Selecciona una colección:
        </label>

        <select id="collectionSelect">

          ${
            collections
              .map(
                collection => `

                  <option
                    value="${collection.id}"
                  >

                    ${collection.name}

                  </option>

                `
              )
              .join("")
          }

        </select>

        <button
          id="saveFavoriteButton"
        >
          Guardar
        </button>

      </div>

    `;

    const saveButton =
      document.getElementById(
        "saveFavoriteButton"
      ) as HTMLButtonElement;

    saveButton.addEventListener(
      "click",
      async () => {

        const select =
          document.getElementById(
            "collectionSelect"
          ) as HTMLSelectElement;

        const collectionId =
          Number(
            select.value
          );

        await guardarFavorito(
          pokemon,
          collectionId
        );

      }
    );

  } catch (error) {

    message.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "Error cargando colecciones."
        }

      </p>

    `;

  }
}


/* ==================================================
   GUARDAR FAVORITO
================================================== */

async function guardarFavorito(
  pokemon: Pokemon,
  collectionId: number
): Promise<void> {

  const message =
    document.getElementById(
      "favoriteMessage"
    ) as HTMLDivElement;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              pokemonId:
                pokemon.id,

              pokemonName:
                pokemon.name,

              organizationId:
                ORGANIZATION_ID
            })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result.message ||
        "No se pudo guardar el favorito"
      );

    }

    message.innerHTML = `

      <p>
        ⭐ Pokémon guardado correctamente.
      </p>

    `;

    cargarColecciones();

  } catch (error) {

    message.innerHTML = `

      <p>

        ${
          error instanceof Error
            ? error.message
            : "Error al guardar el favorito."
        }

      </p>

    `;

  }
}


/* ==================================================
   CARGAR COLECCIONES
================================================== */

async function cargarColecciones(): Promise<void> {

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "Error obteniendo colecciones"
      );

    }

    const collections:
      Collection[] =
      await response.json();

    collectionsContainer.innerHTML =
      "";

    if (
      collections.length === 0
    ) {

      collectionsContainer.innerHTML = `

        <p>
          No tienes colecciones todavía.
        </p>

      `;

      return;
    }

    for (
      const collection
      of collections
    ) {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "collection-card";

      div.innerHTML = `

        <h3>
          ${collection.name}
        </h3>

        <button
          class="view-favorites-button"
          data-id="${collection.id}"
        >
          Ver favoritos
        </button>

        <button
          class="delete-collection-button"
          data-id="${collection.id}"
        >
          Eliminar colección
        </button>

        <div
          id="favorites-${collection.id}"
        ></div>

      `;

      collectionsContainer.appendChild(
        div
      );
    }

    const viewButtons =
      document.querySelectorAll(
        ".view-favorites-button"
      );

    viewButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                (button as HTMLElement)
                  .dataset.id
              );

            cargarFavoritos(
              id
            );

          }
        );

      }
    );

    const deleteButtons =
      document.querySelectorAll(
        ".delete-collection-button"
      );

    deleteButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              Number(
                (button as HTMLElement)
                  .dataset.id
              );

            await eliminarColeccion(
              id
            );

          }
        );

      }
    );

  } catch (error) {

    collectionsContainer.innerHTML = `

      <p>
        No se pudieron cargar las colecciones.
      </p>

    `;

  }
}


/* ==================================================
   CARGAR FAVORITOS
================================================== */

async function cargarFavoritos(
  collectionId: number
): Promise<void> {

  const container =
    document.getElementById(
      `favorites-${collectionId}`
    ) as HTMLDivElement;

  container.innerHTML = `

    <p>
      Cargando favoritos...
    </p>

  `;

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites?organizationId=${ORGANIZATION_ID}`
      );

    if (!response.ok) {

      throw new Error(
        "No se pudieron obtener los favoritos"
      );

    }

    const favorites:
      Favorite[] =
      await response.json();

    if (
      favorites.length === 0
    ) {

      container.innerHTML = `

        <p>
          Esta colección no tiene favoritos.
        </p>

      `;

      return;
    }

    container.innerHTML =
      favorites
        .map(
          favorite => `

            <div
              class="favorite-item"
            >

              <span>
                ⭐ ${favorite.pokemon_name}
              </span>

              <button
                data-collection="${collectionId}"
                data-pokemon="${favorite.pokemon_id}"
                class="delete-favorite-button"
              >
                Eliminar
              </button>

            </div>

          `
        )
        .join("");

    const buttons =
      container.querySelectorAll(
        ".delete-favorite-button"
      );

    buttons.forEach(
      button => {

        button.addEventListener(
          "click",
          async () => {

            const element =
              button as HTMLElement;

            const collection =
              Number(
                element.dataset.collection
              );

            const pokemon =
              Number(
                element.dataset.pokemon
              );

            await eliminarFavorito(
              collection,
              pokemon
            );

            cargarFavoritos(
              collection
            );

          }
        );

      }
    );

  } catch (error) {

    container.innerHTML = `

      <p>
        Error cargando favoritos.
      </p>

    `;

  }
}


/* ==================================================
   ELIMINAR FAVORITO
================================================== */

async function eliminarFavorito(
  collectionId: number,
  pokemonId: number
): Promise<void> {

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites/${pokemonId}?organizationId=${ORGANIZATION_ID}`,
        {
          method:
            "DELETE"
        }
      );

    if (!response.ok) {

      const result =
        await response.json();

      throw new Error(
        result.message ||
        "No se pudo eliminar"
      );

    }

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error eliminando favorito"
    );

  }
}


/* ==================================================
   CREAR COLECCION
================================================== */

async function crearColeccion(): Promise<void> {

  const name =
    collectionNameInput.value
      .trim();

  if (!name) {

    alert(
      "Escribe un nombre para la colección."
    );

    return;
  }

  try {

    const response =
      await fetch(
        COLLECTIONS_URL,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name,
              organizationId:
                ORGANIZATION_ID
            })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result.message ||
        "No se pudo crear la colección"
      );

    }

    collectionNameInput.value =
      "";

    cargarColecciones();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error creando colección."
    );

  }
}


/* ==================================================
   ELIMINAR COLECCION
================================================== */

async function eliminarColeccion(
  collectionId: number
): Promise<void> {

  const confirmar =
    confirm(
      "¿Quieres eliminar esta colección?"
    );

  if (!confirmar) {
    return;
  }

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}?organizationId=${ORGANIZATION_ID}`,
        {
          method:
            "DELETE"
        }
      );

    if (!response.ok) {

      throw new Error(
        "No se pudo eliminar la colección"
      );

    }

    cargarColecciones();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Error eliminando colección."
    );

  }
}


/* ==================================================
   AI TOOLS
================================================== */

function capitalize(
  value: string
): string {

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


function mostrarJSON(
  element: HTMLElement,
  result: unknown
): void {

  element.textContent =
    JSON.stringify(
      result,
      null,
      2
    );
}


function mostrarErrorVisual(
  container: HTMLElement,
  result: any
): void {

  const message =
    result?.error?.message ||
    "No se pudo ejecutar la herramienta.";

  container.innerHTML = `

    <div class="ai-error">

      <strong>
        Error
      </strong>

      <p>
        ${message}
      </p>

      ${
        result?.error?.code
          ? `
            <small>
              Código:
              ${result.error.code}
            </small>
          `
          : ""
      }

    </div>

  `;
}


function renderPokemonVisual(
  container: HTMLElement,
  result: any,
  fullDetails = false
): void {

  if (
    !result?.success ||
    !result?.data
  ) {

    mostrarErrorVisual(
      container,
      result
    );

    return;
  }

  const pokemon =
    result.data;

  const types =
    Array.isArray(
      pokemon.types
    )
      ? pokemon.types
      : [];

  const abilities =
    Array.isArray(
      pokemon.abilities
    )
      ? pokemon.abilities
      : [];

  const stats =
    pokemon.stats &&
    typeof pokemon.stats === "object"
      ? Object.entries(
          pokemon.stats
        )
      : [];

  container.innerHTML = `

    <div class="ai-success">

      Herramienta ejecutada correctamente:

      <strong>
        ${result.tool}
      </strong>

    </div>


    <div class="ai-pokemon-card">

      ${
        pokemon.image
          ? `
            <img
              src="${pokemon.image}"
              alt="${pokemon.name}"
            >
          `
          : ""
      }


      <div class="ai-pokemon-info">

        <h3>
          ${pokemon.name}
        </h3>


        <p>

          <strong>
            ID:
          </strong>

          ${pokemon.id}

        </p>


        <p>

          <strong>
            Tipos:
          </strong>

          ${
            types.length
              ? types
                  .map(
                    (type: string) => `

                      <span class="ai-type">
                        ${type}
                      </span>

                    `
                  )
                  .join("")
              : "No disponibles"
          }

        </p>


        ${
          fullDetails &&
          abilities.length
            ? `

              <p>

                <strong>
                  Habilidades:
                </strong>

              </p>

              <div class="ai-abilities">

                ${
                  abilities
                    .map(
                      (ability: string) => `

                        <span class="ai-ability">
                          ${ability}
                        </span>

                      `
                    )
                    .join("")
                }

              </div>

            `
            : ""
        }

      </div>

    </div>


    ${
      fullDetails &&
      stats.length
        ? `

          <div class="ai-stats">

            ${
              stats
                .map(
                  ([name, value]) => `

                    <div class="ai-stat">

                      <strong>
                        ${value}
                      </strong>

                      <span>
                        ${name}
                      </span>

                    </div>

                  `
                )
                .join("")
            }

          </div>

        `
        : ""
    }


    ${
      fullDetails &&
      Array.isArray(
        pokemon.evolution
      )
        ? `

          <div class="ai-evolution">

            <strong>
              Evolución:
            </strong>

            <p>

              ${
                pokemon.evolution.length
                  ? pokemon.evolution.join(
                      " → "
                    )
                  : "No disponible"
              }

            </p>

          </div>

        `
        : ""
    }

  `;
}


function renderComparisonCard(
  pokemon: any
): string {

  const stats =
    pokemon.stats &&
    typeof pokemon.stats === "object"
      ? Object.entries(
          pokemon.stats
        )
      : [];

  return `

    <div class="ai-comparison-card">

      ${
        pokemon.image
          ? `
            <img
              src="${pokemon.image}"
              alt="${pokemon.name}"
            >
          `
          : ""
      }


      <h3>
        ${pokemon.name}
      </h3>


      <p>

        <strong>
          ID:
        </strong>

        ${pokemon.id}

      </p>


      <p>

        <strong>
          Tipos:
        </strong>

        ${
          Array.isArray(
            pokemon.types
          )
            ? pokemon.types
                .map(
                  (type: string) => `

                    <span class="ai-type">
                      ${type}
                    </span>

                  `
                )
                .join("")
            : "No disponibles"
        }

      </p>


      ${
        stats.length
          ? `

            <div class="ai-stats">

              ${
                stats
                  .map(
                    ([name, value]) => `

                      <div class="ai-stat">

                        <strong>
                          ${value}
                        </strong>

                        <span>
                          ${name}
                        </span>

                      </div>

                    `
                  )
                  .join("")
              }

            </div>

          `
          : ""
      }

    </div>

  `;
}


function renderComparisonVisual(
  container: HTMLElement,
  result: any
): void {

  if (
    !result?.success ||
    !result?.data
  ) {

    mostrarErrorVisual(
      container,
      result
    );

    return;
  }

  container.innerHTML = `

    <div class="ai-success">

      Herramienta ejecutada correctamente:

      <strong>
        compare_pokemon
      </strong>

    </div>


    <div class="ai-comparison">

      ${renderComparisonCard(
        result.data.pokemon1
      )}

      ${renderComparisonCard(
        result.data.pokemon2
      )}

    </div>

  `;
}


/* ==================================================
   CAMBIO VISUAL / JSON
================================================== */

function configurarVistaTool(
  toolName: string
): void {

  const buttons =
    document.querySelectorAll(
      `.tool-view-button[data-tool="${toolName}"]`
    );

  const visual =
    document.getElementById(
      `tool${capitalize(toolName)}Visual`
    ) as HTMLElement | null;

  const json =
    document.getElementById(
      `tool${capitalize(toolName)}Result`
    ) as HTMLElement | null;

  if (
    !visual ||
    !json
  ) {

    return;

  }

  /*
   * IMPORTANTE:
   * Al cargar la página:
   *
   * VISUAL = visible
   * JSON = oculto
   */

  visual.hidden =
    false;

  json.hidden =
    true;


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            (
              button as HTMLElement
            ).dataset.view;

          buttons.forEach(
            item => {

              item.classList.remove(
                "active"
              );

            }
          );

          button.classList.add(
            "active"
          );


          if (
            view === "json"
          ) {

            visual.hidden =
              true;

            json.hidden =
              false;

          } else {

            visual.hidden =
              false;

            json.hidden =
              true;

          }

        }
      );

    }
  );
}


/* ==================================================
   SEARCH TOOL
================================================== */

async function ejecutarSearchTool(): Promise<void> {

  const input =
    document.getElementById(
      "toolSearchName"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolSearchVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolSearchResult"
    ) as HTMLElement;

  const name =
    input.value.trim();


  if (!name) {

    const result = {

      success:
        false,

      tool:
        "search_pokemon",

      error: {

        code:
          "INVALID_NAME",

        message:
          "Ingresa un nombre de Pokémon"

      }

    };

    mostrarJSON(
      json,
      result
    );

    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando herramienta...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/search`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              name
            })
        }
      );

    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderPokemonVisual(
      visual,
      result,
      false
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "search_pokemon",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   DETAILS TOOL
================================================== */

async function ejecutarDetailsTool(): Promise<void> {

  const input =
    document.getElementById(
      "toolDetailsId"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolDetailsVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolDetailsResult"
    ) as HTMLElement;

  const id =
    input.value.trim();


  if (!id) {

    const result = {

      success:
        false,

      tool:
        "get_pokemon_details",

      error: {

        code:
          "INVALID_ID",

        message:
          "Ingresa un ID de Pokémon"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando herramienta...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/details`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              id
            })
        }
      );


    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderPokemonVisual(
      visual,
      result,
      true
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "get_pokemon_details",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   COMPARE TOOL
================================================== */

async function ejecutarCompareTool(): Promise<void> {

  const input1 =
    document.getElementById(
      "toolPokemon1"
    ) as HTMLInputElement;

  const input2 =
    document.getElementById(
      "toolPokemon2"
    ) as HTMLInputElement;

  const visual =
    document.getElementById(
      "toolCompareVisual"
    ) as HTMLElement;

  const json =
    document.getElementById(
      "toolCompareResult"
    ) as HTMLElement;


  const pokemon1 =
    input1.value.trim();

  const pokemon2 =
    input2.value.trim();


  if (
    !pokemon1 ||
    !pokemon2
  ) {

    const result = {

      success:
        false,

      tool:
        "compare_pokemon",

      error: {

        code:
          "INVALID_PARAMETERS",

        message:
          "Debes ingresar los dos Pokémon"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );

    return;
  }


  visual.innerHTML = `

    <p>
      Ejecutando comparación...
    </p>

  `;


  try {

    const response =
      await fetch(
        `${TOOLS_URL}/compare`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              pokemon1,
              pokemon2
            })
        }
      );


    const result =
      await response.json();


    mostrarJSON(
      json,
      result
    );


    renderComparisonVisual(
      visual,
      result
    );

  } catch {

    const result = {

      success:
        false,

      tool:
        "compare_pokemon",

      error: {

        code:
          "NETWORK_ERROR",

        message:
          "No se pudo conectar con el servidor"

      }

    };


    mostrarJSON(
      json,
      result
    );


    mostrarErrorVisual(
      visual,
      result
    );
  }
}


/* ==================================================
   EVENTOS AI TOOLS
================================================== */

const toolSearchButton =
  document.getElementById(
    "toolSearchButton"
  ) as HTMLButtonElement | null;

const toolDetailsButton =
  document.getElementById(
    "toolDetailsButton"
  ) as HTMLButtonElement | null;

const toolCompareButton =
  document.getElementById(
    "toolCompareButton"
  ) as HTMLButtonElement | null;


if (
  toolSearchButton
) {

  toolSearchButton.addEventListener(
    "click",
    ejecutarSearchTool
  );

}


if (
  toolDetailsButton
) {

  toolDetailsButton.addEventListener(
    "click",
    ejecutarDetailsTool
  );

}


if (
  toolCompareButton
) {

  toolCompareButton.addEventListener(
    "click",
    ejecutarCompareTool
  );

}


/* ENTER SEARCH */

const toolSearchInput =
  document.getElementById(
    "toolSearchName"
  ) as HTMLInputElement | null;

if (
  toolSearchInput
) {

  toolSearchInput.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarSearchTool();

      }

    }
  );

}


/* ENTER DETAILS */

const toolDetailsInput =
  document.getElementById(
    "toolDetailsId"
  ) as HTMLInputElement | null;

if (
  toolDetailsInput
) {

  toolDetailsInput.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarDetailsTool();

      }

    }
  );

}


/* ENTER COMPARE */

const toolPokemon1Input =
  document.getElementById(
    "toolPokemon1"
  ) as HTMLInputElement | null;

const toolPokemon2Input =
  document.getElementById(
    "toolPokemon2"
  ) as HTMLInputElement | null;


if (
  toolPokemon1Input
) {

  toolPokemon1Input.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarCompareTool();

      }

    }
  );

}


if (
  toolPokemon2Input
) {

  toolPokemon2Input.addEventListener(
    "keydown",
    (
      event: KeyboardEvent
    ) => {

      if (
        event.key === "Enter"
      ) {

        ejecutarCompareTool();

      }

    }
  );

}


/* CONFIGURAR VISTAS */

configurarVistaTool(
  "search"
);

configurarVistaTool(
  "details"
);

configurarVistaTool(
  "compare"
);


/* ==================================================
   ERROR
================================================== */

function mostrarError(
  mensaje: string
): void {

  resultsContainer.innerHTML = `

    <p>
      ${mensaje}
    </p>

  `;
}


/* ==================================================
   EVENTOS PRINCIPALES
================================================== */

searchButton.addEventListener(
  "click",
  buscarPokemon
);


searchInput.addEventListener(
  "keydown",
  (
    event: KeyboardEvent
  ) => {

    if (
      event.key === "Enter"
    ) {

      buscarPokemon();

    }

  }
);


typeFilter.addEventListener(
  "change",
  () => {

    detailsContainer.innerHTML =
      "";

    cargarPokemons(
      1
    );

  }
);


createCollectionButton.addEventListener(
  "click",
  crearColeccion
);


collectionNameInput.addEventListener(
  "keydown",
  (
    event: KeyboardEvent
  ) => {

    if (
      event.key === "Enter"
    ) {

      crearColeccion();

    }

  }
);


/* ==================================================
   INICIO
================================================== */

cargarPokemons();

crearSelectorOrganizacion();

cargarColecciones();


(
  window as any
).mostrarDetalles =
  mostrarDetalles;

// ============================================================
// ELEVENLABS - ELEMENTOS
// ============================================================

const testPhoneNumber =
  document.getElementById(
    "testPhoneNumber"
  ) as HTMLInputElement | null;

const testCallButton =
  document.getElementById(
    "testCallButton"
  ) as HTMLButtonElement | null;

const testCallStatus =
  document.getElementById(
    "testCallStatus"
  ) as HTMLDivElement | null;

const permanentPrompt =
  document.getElementById(
    "permanentPrompt"
  ) as HTMLTextAreaElement | null;

const loadPermanentPromptButton =
  document.getElementById(
    "loadPermanentPromptButton"
  ) as HTMLButtonElement | null;

const savePermanentPromptButton =
  document.getElementById(
    "savePermanentPromptButton"
  ) as HTMLButtonElement | null;

const permanentPromptStatus =
  document.getElementById(
    "permanentPromptStatus"
  ) as HTMLDivElement | null;

const permanentFirstMessage =
  document.getElementById(
    "permanentFirstMessage"
  ) as HTMLTextAreaElement | null;

const loadAgentConfigurationButton =
  document.getElementById(
    "loadAgentConfigurationButton"
  ) as HTMLButtonElement | null;

const savePermanentFirstMessageButton =
  document.getElementById(
    "savePermanentFirstMessageButton"
  ) as HTMLButtonElement | null;

const permanentFirstMessageStatus =
  document.getElementById(
    "permanentFirstMessageStatus"
  ) as HTMLDivElement | null;

const temporaryPrompt =
  document.getElementById(
    "temporaryPrompt"
  ) as HTMLTextAreaElement | null;

const temporaryFirstMessage =
  document.getElementById(
    "temporaryFirstMessage"
  ) as HTMLTextAreaElement | null;

const clearTemporaryPromptButton =
  document.getElementById(
    "clearTemporaryPromptButton"
  ) as HTMLButtonElement | null;

const temporaryCallButton =
  document.getElementById(
    "temporaryCallButton"
  ) as HTMLButtonElement | null;

const temporaryPromptStatus =
  document.getElementById(
    "temporaryPromptStatus"
  ) as HTMLDivElement | null;


// ============================================================
// UTILIDADES ELEVENLABS
// ============================================================

function mostrarEstadoElevenLabs(
  elemento: HTMLElement | null,
  mensaje: string,
  tipo: "normal" | "loading" | "success" | "error"
): void {

  if (!elemento) {
    return;
  }

  elemento.className =
    `call-test-status ${tipo}`;

  elemento.textContent =
    mensaje;
}


function obtenerMensajeErrorElevenLabs(
  error: unknown
): string {

  return error instanceof Error
    ? error.message
    : "Ocurrió un error desconocido.";
}


function mostrarResultadoLlamada(
  elemento: HTMLElement | null,
  mensaje: string,
  conversationId?: string,
  sipCallId?: string
): void {

  if (!elemento) {
    return;
  }

  elemento.className =
    "call-test-status success";

  elemento.innerHTML = `
    <strong>
      ${mensaje}
    </strong>

    ${
      conversationId
        ? `
          <br>
          <small>
            Conversation ID: ${conversationId}
          </small>
        `
        : ""
    }

    ${
      sipCallId
        ? `
          <br>
          <small>
            SIP Call ID: ${sipCallId}
          </small>
        `
        : ""
    }
  `;
}


interface ElevenLabsResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: {
    conversation_id?: string;
    sip_call_id?: string;
  };
  conversation_id?: string;
  sip_call_id?: string;
}


// ============================================================
// ELEVENLABS - CARGAR PROMPT PERMANENTE
// ============================================================

const cargarPromptPermanente =
  async (): Promise<void> => {

    if (!permanentPrompt) {
      return;
    }

    mostrarEstadoElevenLabs(
      permanentPromptStatus,
      "Cargando prompt desde ElevenLabs...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt"
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "No se pudo cargar el prompt."
        );
      }

      const prompt =
        typeof data === "string"
          ? data
          : data.prompt ||
            data.data?.prompt ||
            "";

      if (!prompt) {

        throw new Error(
          "ElevenLabs no devolvió ningún prompt."
        );
      }

      permanentPrompt.value =
        prompt;

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "Prompt cargado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error cargando prompt de ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - GUARDAR PROMPT PERMANENTE
// ============================================================

const guardarPromptPermanente =
  async (): Promise<void> => {

    if (!permanentPrompt) {
      return;
    }

    const prompt =
      permanentPrompt.value.trim();

    if (!prompt) {

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "El prompt no puede estar vacío.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      permanentPromptStatus,
      "Guardando prompt...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              prompt
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          JSON.stringify(data)
        );
      }

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        "Prompt permanente actualizado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error guardando prompt de ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentPromptStatus,
        `❌ Error al guardar: ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - CARGAR MENSAJE INICIAL PERMANENTE
// ============================================================

const cargarMensajeInicialPermanente =
  async (): Promise<void> => {

    if (!permanentFirstMessage) {
      return;
    }

    mostrarEstadoElevenLabs(
      permanentFirstMessageStatus,
      "Cargando configuración del agente...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/prompt"
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "No se pudo cargar la configuración."
        );
      }

      const firstMessage =
        data.first_message ||
        data.firstMessage ||
        data.conversation_config?.agent?.first_message ||
        data.conversation_config?.agent?.firstMessage ||
        data.data?.first_message ||
        data.data?.firstMessage ||
        data.data?.conversation_config?.agent?.first_message ||
        data.data?.conversation_config?.agent?.firstMessage ||
        "";

      if (!firstMessage) {

        mostrarEstadoElevenLabs(
          permanentFirstMessageStatus,
          "⚠️ El backend actual no devuelve todavía el mensaje inicial.",
          "normal"
        );

        return;
      }

      permanentFirstMessage.value =
        firstMessage;

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "Mensaje inicial cargado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error cargando mensaje inicial:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - GUARDAR MENSAJE INICIAL PERMANENTE
// ============================================================

const guardarMensajeInicialPermanente =
  async (): Promise<void> => {

    if (!permanentFirstMessage) {
      return;
    }

    const firstMessage =
      permanentFirstMessage.value.trim();

    if (!firstMessage) {

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "El mensaje inicial no puede estar vacío.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      permanentFirstMessageStatus,
      "Guardando mensaje inicial...",
      "loading"
    );

    try {

      const response =
        await fetch(
          "/api/elevenlabs/first-message",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              firstMessage
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          JSON.stringify(data)
        );
      }

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        "Mensaje inicial actualizado correctamente.",
        "success"
      );

    } catch (error) {

      console.error(
        "Error guardando mensaje inicial:",
        error
      );

      mostrarEstadoElevenLabs(
        permanentFirstMessageStatus,
        `❌ Error al guardar: ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );
    }
  };


// ============================================================
// ELEVENLABS - LLAMADA NORMAL
// ============================================================

const realizarLlamadaElevenLabs =
  async (): Promise<void> => {

    if (!testPhoneNumber) {
      return;
    }

    const toNumber =
      testPhoneNumber.value.trim();

    if (!toNumber) {

      mostrarEstadoElevenLabs(
        testCallStatus,
        "Debes ingresar un número de destino.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      testCallStatus,
      "📞 Iniciando llamada...",
      "loading"
    );

    if (testCallButton) {
      testCallButton.disabled = true;
    }

    try {

      const response =
        await fetch(
          "/api/elevenlabs/test-call",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              toNumber
            })
          }
        );

      const result:
        ElevenLabsResponse =
        await response.json();

      if (!response.ok ||
          !result.success) {

        throw new Error(
          result.error ||
          result.message ||
          "No se pudo iniciar la llamada."
        );
      }

      const conversationId =
        result.data?.conversation_id ||
        result.conversation_id;

      const sipCallId =
        result.data?.sip_call_id ||
        result.sip_call_id;

      mostrarResultadoLlamada(
        testCallStatus,
        "✅ Llamada iniciada correctamente.",
        conversationId,
        sipCallId
      );

    } catch (error) {

      console.error(
        "Error en llamada ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        testCallStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );

    } finally {

      if (testCallButton) {
        testCallButton.disabled = false;
      }
    }
  };


// ============================================================
// ELEVENLABS - LLAMADA PERSONALIZADA
// ============================================================

const realizarLlamadaPersonalizadaElevenLabs =
  async (): Promise<void> => {

    if (
      !testPhoneNumber ||
      !temporaryPrompt ||
      !temporaryFirstMessage
    ) {
      return;
    }

    const toNumber =
      testPhoneNumber.value.trim();

    const customPrompt =
      temporaryPrompt.value.trim();

    const customFirstMessage =
      temporaryFirstMessage.value.trim();

    if (!toNumber) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Primero ingresa el número de destino.",
        "error"
      );

      return;
    }

    if (!customPrompt) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Escribe un prompt temporal.",
        "error"
      );

      return;
    }

    if (!customFirstMessage) {

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        "Escribe el mensaje temporal.",
        "error"
      );

      return;
    }

    mostrarEstadoElevenLabs(
      temporaryPromptStatus,
      "📞 Iniciando llamada personalizada...",
      "loading"
    );

    if (temporaryCallButton) {
      temporaryCallButton.disabled = true;
    }

    try {

      const response =
        await fetch(
          "/api/elevenlabs/test-call",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              toNumber,
              temporaryPrompt:
                customPrompt,
              temporaryFirstMessage:
                customFirstMessage
            })
          }
        );

      const result:
        ElevenLabsResponse =
        await response.json();

      if (!response.ok ||
          !result.success) {

        throw new Error(
          result.error ||
          result.message ||
          "No se pudo iniciar la llamada personalizada."
        );
      }

      const conversationId =
        result.data?.conversation_id ||
        result.conversation_id;

      const sipCallId =
        result.data?.sip_call_id ||
        result.sip_call_id;

      mostrarResultadoLlamada(
        temporaryPromptStatus,
        "✅ Llamada personalizada iniciada correctamente.",
        conversationId,
        sipCallId
      );

    } catch (error) {

      console.error(
        "Error en llamada personalizada ElevenLabs:",
        error
      );

      mostrarEstadoElevenLabs(
        temporaryPromptStatus,
        `❌ ${obtenerMensajeErrorElevenLabs(error)}`,
        "error"
      );

    } finally {

      if (temporaryCallButton) {
        temporaryCallButton.disabled = false;
      }
    }
  };


// ============================================================
// ELEVENLABS - LIMPIAR TEMPORALES
// ============================================================

const limpiarCamposTemporales =
  (): void => {

    if (temporaryPrompt) {
      temporaryPrompt.value = "";
    }

    if (temporaryFirstMessage) {
      temporaryFirstMessage.value = "";
    }

    mostrarEstadoElevenLabs(
      temporaryPromptStatus,
      "Campos temporales limpiados.",
      "normal"
    );
  };


// ============================================================
// ELEVENLABS - EVENTOS
// ============================================================

if (testCallButton) {

  testCallButton.addEventListener(
    "click",
    realizarLlamadaElevenLabs
  );
}

if (loadPermanentPromptButton) {

  loadPermanentPromptButton.addEventListener(
    "click",
    cargarPromptPermanente
  );
}

if (savePermanentPromptButton) {

  savePermanentPromptButton.addEventListener(
    "click",
    guardarPromptPermanente
  );
}

if (loadAgentConfigurationButton) {

  loadAgentConfigurationButton.addEventListener(
    "click",
    cargarMensajeInicialPermanente
  );
}

if (savePermanentFirstMessageButton) {

  savePermanentFirstMessageButton.addEventListener(
    "click",
    guardarMensajeInicialPermanente
  );
}

if (temporaryCallButton) {

  temporaryCallButton.addEventListener(
    "click",
    realizarLlamadaPersonalizadaElevenLabs
  );
}

if (clearTemporaryPromptButton) {

  clearTemporaryPromptButton.addEventListener(
    "click",
    limpiarCamposTemporales
  );
}


// ============================================================
// INICIALIZACION ELEVENLABS
// ============================================================

// No ejecutamos llamadas automáticamente.
// El usuario decide cuándo llamar desde la interfaz.
