import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /html → returns the HTML file
router.get("/", (_req, res) => {
    const htmlPath = path.join(__dirname, "../html/page.html");
    res.sendFile(htmlPath);
});

export default router;
