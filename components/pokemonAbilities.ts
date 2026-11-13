export function PokemonAbilities(
  abilities: string[]
): string {

  return `
    <h3>Habilidades</h3>

    <div class="abilities">

      ${abilities
        .map(
          (ability) => `
            <span>
              ${ability}
            </span>
          `
        )
        .join("")}

    </div>
  `;
}