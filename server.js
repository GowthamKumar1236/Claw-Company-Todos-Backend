// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

// Register Route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) return res.status(400).send(err.message);
        res.status(201).send({ id: this.lastID });
    });
});

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(400).send(err.message);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        db.run(`INSERT INTO sessions (user_id, login_time, ip_address) VALUES (?, datetime('now'), ?)`, [user.id, req.ip], function(err) {
            if (err) return res.status(400).send(err.message);
            res.send({ token });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send('A token is required');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).send('Invalid token');
        req.user = user;
        next();
    });
};

// Create To-Do
app.post('/todos', authenticateJWT, (req, res) => {
    const { description, status } = req.body;
    const { id: userId } = req.user;
    db.run(`INSERT INTO todos (user_id, description, status) VALUES (?, ?, ?)`, [userId, description, status], function(err) {
        if (err) return res.status(400).send(err.message);
        res.status(201).send({ id: this.lastID });
    });
});

// Get All To-Dos
app.get('/todos', authenticateJWT, (req, res) => {
    const { id: userId } = req.user;
    db.all(`SELECT * FROM todos WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(400).send(err.message);
        res.send(rows);
    });
});

// Update To-Do
app.put('/todos/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const { description, status } = req.body;
    const { id: userId } = req.user;
    db.run(`UPDATE todos SET description = ?, status = ? WHERE id = ? AND user_id = ?`, [description, status, id, userId], function(err) {
        if (err) return res.status(400).send(err.message);
        res.send({ updated: this.changes });
    });
});

// Delete To-Do
app.delete('/todos/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;
    db.run(`DELETE FROM todos WHERE id = ? AND user_id = ?`, [id, userId], function(err) {
        if (err) return res.status(400).send(err.message);
        res.send({ deleted: this.changes });
    });
});

// Get All Sessions
app.get('/sessions', authenticateJWT, (req, res) => {
    const { id: userId } = req.user;
    db.all(`SELECT * FROM sessions WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(400).send(err.message);
        res.send(rows);
    });
});
