
import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "html_viewer",
    password: "root",
    port: 5432,
});
async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS webviews (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      webview_id INT REFERENCES webviews(id) ON DELETE CASCADE,
      author VARCHAR(100) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

    const res = await pool.query("SELECT COUNT(*) FROM webviews");
    if (parseInt(res.rows[0].count, 10) === 0) {
        const samplePages = [
            {
                title: "Welcome Page",
                content: "<html><body><h1>Welcome!</h1><p>This is the first page.</p></body></html>",
            },
            {
                title: "About Us",
                content: "<html><body><h1>About Us</h1><p>We build Flutter + Node apps.</p></body></html>",
            },
            {
                title: "Contact",
                content: "<html><body><h1>Contact</h1><p>Email: support@example.com</p></body></html>",
            },
            {
                title: "Blog",
                content: "<html><body><h1>Blog</h1><p>Latest posts go here.</p></body></html>",
            },
        ];

        for (const page of samplePages) {
            await pool.query(
                "INSERT INTO webviews (title, content) VALUES ($1, $2)",
                [page.title, page.content]
            );
        }
        console.log("Seeded 4 sample HTML pages ✅");
    }
}

app.get("/webviews", async (req, res) => {
    const result = await pool.query("SELECT * FROM webviews ORDER BY created_at DESC");
    res.json(result.rows);
});

app.get("/webviews/:id", async (req, res) => {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM webviews WHERE id = $1", [id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Webview not found" });
    }
    res.json(result.rows[0]);
});

app.post("/webviews", async (req, res) => {
    const { title, content } = req.body;
    const result = await pool.query(
        "INSERT INTO webviews (title, content) VALUES ($1, $2) RETURNING *",
        [title, content]
    );
    res.status(201).json(result.rows[0]);
});

app.get("/webviews/:id/comments", async (req, res) => {
    const { id } = req.params;
    const result = await pool.query(
        "SELECT * FROM comments WHERE webview_id = $1 ORDER BY created_at DESC",
        [id]
    );
    res.json(result.rows);
});

app.post("/webviews/:id/comments", async (req, res) => {
    const { id } = req.params;
    const { author, text } = req.body;
    const result = await pool.query(
        "INSERT INTO comments (webview_id, author, text) VALUES ($1, $2, $3) RETURNING *",
        [id, author, text]
    );
    res.status(201).json(result.rows[0]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    await initDb();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
