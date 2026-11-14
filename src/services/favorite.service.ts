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
  collectionId: number
): Promise<Favorite> => {
  const result = await pool.query(
    `
    INSERT INTO favorites
      (pokemon_id, pokemon_name, collection_id)
    VALUES
      ($1, $2, $3)
    RETURNING *
    `,
    [
      pokemonId,
      pokemonName,
      collectionId
    ]
  );

  return result.rows[0];
};

export const getFavoritesByCollection =
  async (
    collectionId: number
  ): Promise<Favorite[]> => {

    const result = await pool.query(
      `
      SELECT *
      FROM favorites
      WHERE collection_id = $1
      ORDER BY id
      `,
      [collectionId]
    );

    return result.rows;
  };

export const deleteFavorite =
  async (
    collectionId: number,
    pokemonId: number
  ): Promise<boolean> => {

    const result = await pool.query(
      `
      DELETE FROM favorites
      WHERE collection_id = $1
        AND pokemon_id = $2
      `,
      [
        collectionId,
        pokemonId
      ]
    );

    return result.rowCount === 1;
  };