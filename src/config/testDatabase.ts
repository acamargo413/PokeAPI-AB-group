import pool from "./database.js";

async function testDatabase(): Promise<void> {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL conectado:");
    console.log(result.rows[0]);

  } catch (error) {
    console.error(
      "Error conectando a PostgreSQL:",
      error
    );

  } finally {
    await pool.end();
  }
}

testDatabase();