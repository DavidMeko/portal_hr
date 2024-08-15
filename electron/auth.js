const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let db;
const SECRET_KEY = 'your-secret-key'; // In a real app, this should be an environment variable

function initAuth(database) {
    db = database;
    return createAdminUser();
}

async function createAdminUser() {
    const adminUser = await getUser('admin');
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin'], function(err) {
                if (err) {
                    console.error('Error creating admin user:', err);
                    reject(err);
                } else {
                    console.log('Admin user created successfully');
                    resolve();
                }
            });
        });
    }
    return Promise.resolve();
}

async function getUser(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function createUser(username, password, role) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

async function loginUser(username, password) {
    const user = await getUser(username);
    if (!user) {
        throw new Error('User not found');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Invalid password');
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return { user: { id: user.id, username: user.username, role: user.role }, token };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

function invalidateToken(token) {
    // In a more complex system, you might want to add the token to a blacklist
    // For now, we'll just let the token expire naturally
}

async function getUsers() {
    return new Promise((resolve, reject) => {
        db.all('SELECT id, username, role FROM users', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function updateUser(id, username, role) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

async function deleteUser(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

module.exports = {
    initAuth,
    createUser,
    loginUser,
    verifyToken,
    invalidateToken,
    getUsers,
    updateUser,
    deleteUser
};