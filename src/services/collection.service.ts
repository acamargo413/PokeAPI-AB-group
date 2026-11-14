import pool from "../config/database.js";

export interface Collection {
  id: number;
  name: string;
  created_at: Date;
}

export const createCollection = async (
  name: string
): Promise<Collection> => {
  const result = await pool.query(
    `
    INSERT INTO collections (name)
    VALUES ($1)
    RETURNING *
    `,
    [name]
  );

  return result.rows[0];
};

export const getCollections =
  async (): Promise<Collection[]> => {
    const result = await pool.query(
      `
      SELECT *
      FROM collections
      ORDER BY id
      `
    );

    return result.rows;
  };

export const updateCollection = async (
  id: number,
  name: string
): Promise<Collection | null> => {
  const result = await pool.query(
    `
    UPDATE collections
    SET name = $1
    WHERE id = $2
    RETURNING *
    `,
    [name, id]
  );

  return result.rows[0] ?? null;
};

export const deleteCollection =
  async (id: number): Promise<boolean> => {

    const result = await pool.query(
      `
      DELETE FROM collections
      WHERE id = $1
      `,
      [id]
    );

    return result.rowCount === 1;
  };