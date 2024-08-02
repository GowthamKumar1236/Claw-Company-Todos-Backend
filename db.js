// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const dbPath = path.resolve(__dirname, 'todo.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`, (err) => {
  if (err) {
    console.error('Error creating users table:', err.message);
  } else {
    console.log('Users table created successfully.');
  }
});

// Create todos table
db.run(`CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  description TEXT,
  status TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`, (err) => {
  if (err) {
    console.error('Error creating todos table:', err.message);
  } else {
    console.log('Todos table created successfully.');
  }
});

// Create sessions table
db.run(`CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  login_time TEXT,
  logout_time TEXT,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`, (err) => {
  if (err) {
    console.error('Error creating sessions table:', err.message);
  } else {
    console.log('Sessions table created successfully.');
  }
});

module.exports = db;
