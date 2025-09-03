import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

export async function initDb() {
    // Pages table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Comments table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      page TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Insert dummy pages (if not already there)
    const existing = await pool.query("SELECT COUNT(*) FROM pages");
    if (parseInt(existing.rows[0].count) === 0) {
        await pool.query(`
      INSERT INTO pages (slug, title, content) VALUES
      ('page1', 'Welcome Page', '<html><body><h1>Welcome</h1><p>This is Page 1</p></body></html>'),
      ('page2', 'About Page', '<html><body><h1>About Us</h1><p>This is Page 2</p></body></html>'),
      ('page3', 'Contact Page', '<html><body><h1>Contact</h1><p>This is Page 3</p></body></html>')
    `);
    }
}
