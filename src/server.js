// src/server.js
import express from "express";
import { pool, initDb } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize DB at startup
(async () => {
    try {
        await initDb();
        console.log("✅ Database initialized");
    } catch (err) {
        console.error("❌ DB init error:", err);
    }
})();

// CREATE a comment
app.post("/comments", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
        const result = await pool.query(
            "INSERT INTO comments (text) VALUES ($1) RETURNING *",
            [text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ all comments
app.get("/comments", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM comments ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ a single comment
app.get("/comments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query("SELECT * FROM comments WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Comment not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a comment
app.put("/comments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
        const result = await pool.query(
            "UPDATE comments SET text = $1 WHERE id = $2 RETURNING *",
            [text, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Comment not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a comment
app.delete("/comments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query("DELETE FROM comments WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Comment not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
