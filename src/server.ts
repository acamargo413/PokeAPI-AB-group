import app from "./app.js";
import ragRoutes from "./rag/rag.routes.js";

app.use("/api/rag", ragRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en http://localhost:${PORT}`
  );
});