// 📌 Importar módulos necesarios
import pkg from 'pg';
import dotenv from "dotenv-safe";

dotenv.config();

const { Pool } = pkg;

// 📌 Configurar el pool de conexiones para PostgreSQL
const pool = new Pool({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10, // 📌 Número máximo de conexiones simultáneas
    // idleTimeoutMillis: 10000, // 10 segundos de inactividad antes de cerrar
    //  connectionTimeoutMillis: 5000 // 5 segundos para establecer una conexión

});

// 📌 Verificar conexión con el pool
(async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Conexión a la base de datos PostgreSQL establecida.");
        client.release(); // 📌 Liberar la conexión después de la prueba
    } catch (err) {
        console.error("❌ Error al conectar con la base de datos:", err);
    }
})();


export default pool;
