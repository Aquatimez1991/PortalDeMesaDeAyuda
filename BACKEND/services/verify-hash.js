import bcrypt from 'bcrypt';

const password = 'admin';
const hash = '$2b$10$2hsbD6YVRUj3Gh3DkOZkfuRy57mWBKxfwmtTS2uZwWGuVAgPLsc4K';

bcrypt.compare(password, hash).then(result => {
    console.log(result ? '✔️ Coinciden' : '❌ No coinciden');
});
