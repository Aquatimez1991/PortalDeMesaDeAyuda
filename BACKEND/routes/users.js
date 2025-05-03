
import express from "express";
import pool from "../connection.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv-safe";
import crypto from "crypto";
import { authenticateToken } from "../services/authentication.js";
import { checkRole } from "../services/checkRole.js";

dotenv.config();
const saltRounds = 10; // 📌 Definir las rondas de encriptación
const router = express.Router();

// 📌 Inicio de sesión
router.post("/login", async (req, res) => {
    const { username, passworduser } = req.body;

    const query = `SELECT id, username, passworduser, statususers, roleuser, failed_login_attempts, last_login FROM usersportalmesa WHERE username = $1`;

    try {
        const { rows } = await pool.query(query, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos." });
        }

        const user = rows[0];

        // 🔒 Si usuario está desactivado
        if (!user.statususers) {
            return res.status(403).json({ message: "Espera la aprobación del administrador." });
        }

        // 🕒 Si tiene 5 intentos fallidos, comprobar si pasaron 5 minutos
        if (user.failed_login_attempts >= 5) {
            const lastLoginTime = user.last_login ? new Date(user.last_login) : null;
            const now = new Date();
            const diffMs = lastLoginTime ? now - lastLoginTime : 0;
            const diffMinutes = diffMs / (1000 * 60);

            if (diffMinutes < 5) {
                return res.status(429).json({
                    message: `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(5 - diffMinutes)} minutos.`,
                });
            }
        }

        // 🔑 Verificar contraseña
        const match = await bcrypt.compare(passworduser, user.passworduser);
        if (!match) {
            const updatedAttempts = user.failed_login_attempts + 1;

            // 🚨 Si llegó a 10 intentos → bloquear permanentemente
            if (updatedAttempts >= 10) {
                await pool.query(
                    `UPDATE usersportalmesa SET failed_login_attempts = $1, statususers = false, last_login = CURRENT_TIMESTAMP WHERE id = $2`,
                    [updatedAttempts, user.id]
                );

                return res.status(403).json({ message: "Tu cuenta ha sido bloqueada. Contacta al administrador." });
            }

            // 🔁 Si falló menos de 10, solo incrementamos
            await pool.query(
                `UPDATE usersportalmesa SET failed_login_attempts = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2`,
                [updatedAttempts, user.id]
            );

            return res.status(401).json({ message: "Usuario o contraseña incorrectos." });
        }

        // ✅ Login exitoso → reiniciar intentos
        await pool.query(
            `UPDATE usersportalmesa SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
        );

        const payload = {
            username: user.username,
            roleuser: user.roleuser,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "8h",
        });

        res.status(200).json({ token: accessToken });

    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: err.message || "Error interno del servidor" });
    }
});


// 📌 Registro de usuarios con todos los campos
router.post("/signup", async (req, res) => {
    const {
        username,
        fullname,
        lastname,
        organizationbody,
        organizationunit,
        organizationarea,
        organizationposition,
        typeuser,
        contactnumber,
        emailuser,
        passworduser
    } = req.body;

    // Validación básica
    if (!username || !fullname || !lastname || !emailuser || !passworduser) {
        return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    try {
        // Verificar si ya existe el usuario por correo
        const checkQuery = `SELECT emailuser FROM usersportalmesa WHERE emailuser = $1`;
        const { rows } = await pool.query(checkQuery, [emailuser]);

        if (rows.length > 0) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(passworduser, saltRounds);

        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usersportalmesa (
                username, fullname, lastname,
                organizationbody, organizationunit, organizationarea,
                organizationposition, typeuser, contactnumber,
                emailuser, passworduser, statususers,
                roleuser, is_verified
            )
            VALUES (
                       $1, $2, $3,
                       $4, $5, $6,
                       $7, $8, $9,
                       $10, $11, false,
                       'user', false
                   )
        `;

        await pool.query(insertQuery, [
            username,
            fullname,
            lastname,
            organizationbody || null,
            organizationunit || null,
            organizationarea || null,
            organizationposition || null,
            typeuser || 'external',
            contactnumber || null,
            emailuser,
            hashedPassword
        ]);

        return res.status(201).json({
            message: "Registro exitoso. Espera la aprobación del administrador."
        });

    } catch (err) {
        console.error("Error al registrar usuario:", err);
        return res.status(500).json({ error: "Error interno al registrar el usuario." });
    }
});



// 📌 Ruta para verificar si el token es válido
router.get("/checkToken", authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" });
});

// 📌 Ruta para actualizar el estado de un usuario por su ID
router.patch("/update", authenticateToken, checkRole, async (req, res) => {
    const { statususers, id } = req.body;

    if (typeof statususers !== "boolean" || !id) {
        return res.status(400).json({ message: "Datos inválidos para la actualización." });
    }

    // Si se reactiva al usuario, también se reinician los intentos
    const query = statususers
        ? `UPDATE usersportalmesa SET statususers = $1, failed_login_attempts = 0 WHERE id = $2`
        : `UPDATE usersportalmesa SET statususers = $1 WHERE id = $2`;

    try {
        const result = await pool.query(query, [statususers, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "El ID de usuario no existe." });
        }

        return res.status(200).json({ message: "Estado del usuario actualizado con éxito." });

    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        return res.status(500).json({ error: "Error interno al actualizar el usuario." });
    }
});


export default router;
