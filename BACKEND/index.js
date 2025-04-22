import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import userRoute from './routes/users.js';


const app = express();

// 📌 Configurar CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));

// 📌 Middleware para registrar solicitudes
app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📌 Definir rutas
app.use('/users', userRoute);


// 📌 Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente 🚀' });
});

export default app;