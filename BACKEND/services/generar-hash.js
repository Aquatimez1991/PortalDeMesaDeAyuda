// generar-hash.js
import bcrypt from 'bcrypt';

const password = 'miContraseña123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) throw err;
    console.log('Contraseña encriptada:', hash);
});
