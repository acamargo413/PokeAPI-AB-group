import pool from "../config/database.js";

export interface Favorite {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  collection_id: number;
  created_at: Date;
}

export const addFavorite = async (
  pokemonId: number,
  pokemonName: string,
  collectionId: number,
  organizationId: number
): Promise<Favorite> => {

  const result = await pool.query(
    `
    INSERT INTO favorites
      (pokemon_id, pokemon_name, collection_id)
    SELECT
      $1,
      $2,
      c.id
    FROM collections c
    WHERE c.id = $3
      AND c.organization_id = $4
    RETURNING *
    `,
    [
      pokemonId,
      pokemonName,
      collectionId,
      organizationId
    ]
  );

  if (result.rows.length === 0) {
    throw new Error(
      "Colección no encontrada en esta organización"
    );
  }

  return result.rows[0];
};


export const getFavoritesByCollection =
  async (
    collectionId: number,
    organizationId: number
  ): Promise<Favorite[]> => {

    const result = await pool.query(
      `
      SELECT f.*
      FROM favorites f
      INNER JOIN collections c
        ON c.id = f.collection_id
      WHERE f.collection_id = $1
        AND c.organization_id = $2
      ORDER BY f.id
      `,
      [
        collectionId,
        organizationId
      ]
    );

    return result.rows;
  };


export const deleteFavorite =
  async (
    collectionId: number,
    pokemonId: number,
    organizationId: number
  ): Promise<boolean> => {

    const result = await pool.query(
      `
      DELETE FROM favorites f
      USING collections c
      WHERE f.collection_id = c.id
        AND f.collection_id = $1
        AND f.pokemon_id = $2
        AND c.organization_id = $3
      `,
      [
        collectionId,
        pokemonId,
        organizationId
      ]
    );

    return result.rowCount === 1;
  };