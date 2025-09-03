import express from "express";
import { initDb, pool } from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Initialize DB
(async () => {
    try {
        await initDb();
        console.log("✅ Database initialized");
    } catch (err) {
        console.error("❌ DB init error:", err);
    }
})();

// Routes
app.get("/", (req, res) => {
    res.send("🚀 Server is running with PostgreSQL on Render!");
});

// Get all comments for a page
app.get("/comments/:page", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM comments WHERE page = $1 ORDER BY created_at DESC",
            [req.params.page]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a comment
app.post("/comments", async (req, res) => {
    try {
        const { page, content } = req.body;
        const result = await pool.query(
            "INSERT INTO comments (page, content) VALUES ($1, $2) RETURNING *",
            [page, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🌍 Server running on port ${PORT}`);
});
