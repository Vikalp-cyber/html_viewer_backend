import { Router } from "express";
import Joi from "joi";
import { getConnection } from "../db.js";

const router = Router();

const payloadSchema = Joi.object({
    text: Joi.string().trim().min(1).max(500).required(),
});

function rowToComment(row) {
    // row = [id, text, created_at, updated_at]
    return {
        id: row[0],
        text: row[1],
        created_at: row[2],
        updated_at: row[3]
    };
}

/**
 * GET /comments
 * Optional query params: limit, offset, search
 */
router.get("/", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);
    const search = (req.query.search || "").trim();

    let conn;
    try {
        conn = await getConnection();
        let sql = `
      SELECT id, text, created_at, updated_at
      FROM comments
    `;
        const binds = {};
        if (search) {
            sql += ` WHERE LOWER(text) LIKE :search `;
            binds.search = `%${search.toLowerCase()}%`;
        }
        sql += ` ORDER BY created_at DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
        binds.offset = offset;
        binds.limit = limit;

        const result = await conn.execute(sql, binds, { outFormat: 4002 });
        const items = result.rows.map(rowToComment);
        res.json({ items, count: items.length, limit, offset });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch comments" });
    } finally {
        if (conn) await conn.close();
    }
});

/**
 * POST /comments
 */
router.post("/", async (req, res) => {
    const { error, value } = payloadSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    let conn;
    try {
        conn = await getConnection();

        const result = await conn.execute(
            `INSERT INTO comments (text) VALUES (:text) RETURNING id, text, created_at, updated_at INTO :id, :text2, :created, :updated`,
            {
                text: value.text,
                id: { dir: 3003, type: 2002 },        // BIND_OUT, NUMBER
                text2: { dir: 3003, type: 2001 },     // BIND_OUT, STRING
                created: { dir: 3003, type: 2033 },   // BIND_OUT, DATE/TIMESTAMP
                updated: { dir: 3003, type: 2033 },   // BIND_OUT, DATE/TIMESTAMP
            }
        );

        await conn.commit();

        // When RETURNING with multiple columns, access outBinds arrays:
        const out = result.outBinds;
        const response = {
            id: out.id[0],
            text: out.text2[0],
            created_at: out.created[0],
            updated_at: out.updated[0],
        };

        res.status(201).json(response);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create comment" });
    } finally {
        if (conn) await conn.close();
    }
});

/**
 * PUT /comments/:id
 */
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const { error, value } = payloadSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(
            `UPDATE comments SET text = :text, updated_at = SYSTIMESTAMP WHERE id = :id`,
            { text: value.text, id }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        const fetch = await conn.execute(
            `SELECT id, text, created_at, updated_at FROM comments WHERE id = :id`,
            { id },
            { outFormat: 4002 }
        );

        await conn.commit();

        res.json(rowToComment(fetch.rows[0]));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update comment" });
    } finally {
        if (conn) await conn.close();
    }
});

/**
 * DELETE /comments/:id
 */
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(`DELETE FROM comments WHERE id = :id`, { id });
        await conn.commit();
        if (result.rowsAffected === 0) return res.status(404).json({ error: "Not found" });
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete comment" });
    } finally {
        if (conn) await conn.close();
    }
});

export default router;
