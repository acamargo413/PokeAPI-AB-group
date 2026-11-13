export function PokemonEvolution(
  evolution: string[]
): string {

  return `
    <h3>Evolución</h3>

    <div class="evolution">

      ${evolution
        .map(
          (pokemon) => `
            <span>
              ${pokemon}
            </span>
          `
        )
        .join(" → ")}

    </div>
  `;
}