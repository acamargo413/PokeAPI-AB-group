export function PokemonHeader(
  pokemon: any
): string {

  return `
    <div class="header">

      <img
        src="${pokemon.image}"
        alt="${pokemon.name}"
      >

      <h2>
        ${pokemon.name}
      </h2>

      <p>
        Tipo:
        ${pokemon.types.join(", ")}
      </p>

    </div>
  `;
}