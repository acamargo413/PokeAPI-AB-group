import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "pokemon_api",
  user: "postgres",
  password: "postgres123",
});

export default pool;