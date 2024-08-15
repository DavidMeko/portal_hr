const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function createDbConnection() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(__dirname, 'hr_portal.db');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
            } else {
                console.log('Connected to the HR portal database.');
                createTables();
                resolve(db);
            }
        });
    });
}

function createTables() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            user_name TEXT,
            department TEXT,
            hospital TEXT,
            status TEXT,
            personal_id TEXT,
            relationship_status TEXT,
            civil_status TEXT,
            religion TEXT,
            age INTEGER,
            address TEXT,
            bank_information TEXT,
            company TEXT,
            job_title TEXT,
            role TEXT,
            level INTEGER,
            job_percentage INTEGER,
            manager_name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS roles (
            role_id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transaction_subtypes (
            subtype_id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER,
            subtype_name TEXT,
            FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS authorizations (
            authorization_id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            transaction_id INTEGER,
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
            FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            password TEXT,
            role TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS employee_role (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            role_id INTEGER,
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
            FOREIGN KEY (role_id) REFERENCES roles(role_id)
        )`);
    });
}

module.exports = {
    createDbConnection,
    getDb: () => db
};