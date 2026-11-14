import pool from "../config/database.js";

export interface Collection {
  id: number;
  name: string;
  organization_id: number;
  created_at: Date;
}

export const createCollection = async (
  name: string,
  organizationId: number
): Promise<Collection> => {

  const result = await pool.query(
    `
    INSERT INTO collections
      (name, organization_id)
    VALUES
      ($1, $2)
    RETURNING *
    `,
    [name, organizationId]
  );

  return result.rows[0];
};

export const getCollections = async (
  organizationId: number
): Promise<Collection[]> => {

  const result = await pool.query(
    `
    SELECT *
    FROM collections
    WHERE organization_id = $1
    ORDER BY id
    `,
    [organizationId]
  );

  return result.rows;
};

export const updateCollection = async (
  id: number,
  name: string,
  organizationId: number
): Promise<Collection | null> => {

  const result = await pool.query(
    `
    UPDATE collections
    SET name = $1
    WHERE id = $2
      AND organization_id = $3
    RETURNING *
    `,
    [name, id, organizationId]
  );

  return result.rows[0] ?? null;
};

export const deleteCollection = async (
  id: number,
  organizationId: number
): Promise<boolean> => {

  const result = await pool.query(
    `
    DELETE FROM collections
    WHERE id = $1
      AND organization_id = $2
    `,
    [id, organizationId]
  );

  return result.rowCount === 1;
};