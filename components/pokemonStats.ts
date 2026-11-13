export function PokemonStats(
  stats: Record<string, number>
): string {

  return `
    <h3>Estadísticas</h3>

    <div class="stats">

      ${Object.entries(stats)
        .map(
          ([name, value]) => `

            <div class="stat">

              <span>
                ${name}
              </span>

              <strong>
                ${value}
              </strong>

            </div>

          `
        )
        .join("")}

    </div>
  `;
}