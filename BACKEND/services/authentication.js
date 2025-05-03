import dotenv from "dotenv-safe";
import jwt from "jsonwebtoken";

dotenv.config();

// 📌 Autenticar el token de acceso
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Acceso no autorizado: Token no proporcionado" });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Error del servidor: Falta JWT_SECRET en configuración" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido o expirado" });
        }

        res.locals.user = decoded;  // ✅ Mantienes el objeto completo
        res.locals.email = decoded.email;  // ✅ Agregas el email de forma directa
        next();
    });

}

export { authenticateToken };