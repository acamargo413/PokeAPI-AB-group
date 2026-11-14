const API_URL =
  "http://localhost:3000/api/pokemon";

const COLLECTIONS_URL =
  "http://localhost:3000/api/collections";

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
  created_at: string;
}

interface Favorite {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  collection_id: number;
  created_at: string;
}


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

  paginationContainer.innerHTML = "";

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


function mostrarLista(
  pokemons:
    PokemonListResponse["data"]
): void {

  resultsContainer.innerHTML = "";

  if (pokemons.length === 0) {

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


function obtenerIdDesdeUrl(
  url: string
): string {

  const partes =
    url.split("/");

  return partes[
    partes.length - 2
  ];
}


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
          <strong>Tipos:</strong>
          ${pokemon.types.join(", ")}
        </p>

        <p>
          <strong>Habilidades:</strong>
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
        COLLECTIONS_URL
      );

    if (!response.ok) {
      throw new Error(
        "No se pudieron cargar las colecciones"
      );
    }

    const collections:
      Collection[] =
      await response.json();

    if (collections.length === 0) {

      message.innerHTML = `
        <p>
          No tienes colecciones.
          Crea una en la sección "Mis colecciones".
        </p>
      `;

      return;
    }

    message.innerHTML = `
      <div style="margin-top: 15px;">

        <label>
          Selecciona una colección:
        </label>

        <select id="collectionSelect">
          ${collections
            .map(
              collection => `
                <option value="${collection.id}">
                  ${collection.name}
                </option>
              `
            )
            .join("")
          }
        </select>

        <button id="saveFavoriteButton">
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
          Number(select.value);

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
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            pokemonId:
              pokemon.id,
            pokemonName:
              pokemon.name
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


async function cargarColecciones(): Promise<void> {

  try {

    const response =
      await fetch(
        COLLECTIONS_URL
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

    if (collections.length === 0) {

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
        `${COLLECTIONS_URL}/${collectionId}/favorites`
      );

    if (!response.ok) {
      throw new Error(
        "No se pudieron obtener los favoritos"
      );
    }

    const favorites:
      Favorite[] =
      await response.json();

    if (favorites.length === 0) {

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
            <div class="favorite-item">

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


async function eliminarFavorito(
  collectionId: number,
  pokemonId: number
): Promise<void> {

  try {

    const response =
      await fetch(
        `${COLLECTIONS_URL}/${collectionId}/favorites/${pokemonId}`,
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

          body: JSON.stringify({
            name
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
        `${COLLECTIONS_URL}/${collectionId}`,
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


function mostrarError(
  mensaje: string
): void {

  resultsContainer.innerHTML = `
    <p>
      ${mensaje}
    </p>
  `;
}


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

    cargarPokemons(1);
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


cargarPokemons();

cargarColecciones();

(
  window as any
).mostrarDetalles =
  mostrarDetalles;