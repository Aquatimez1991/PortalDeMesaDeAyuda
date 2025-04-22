import dotenv from "dotenv-safe";

dotenv.config();

// 📌 Verificar el rol del usuario
function checkRole(req, res, next) {
    const userRole = res.locals.user?.roleuser;

    if (!userRole) {
        return res.status(403).json({ message: "Acceso denegado: rol no definido" });
    }

    if (userRole === "user") {
        return res.status(401).json({ message: "Acceso no autorizado" });
    }

    next();
}

export { checkRole };
