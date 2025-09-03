import express from 'express';
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory comment store
let comments = [];
let nextId = 1;

// CREATE a comment
app.post('/comments', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const newComment = { id: nextId++, text };
    comments.push(newComment);
    res.status(201).json(newComment);
});

// READ all comments
app.get('/comments', (req, res) => {
    res.json(comments);
});

// READ a single comment
app.get('/comments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const comment = comments.find(c => c.id === id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    res.json(comment);
});

// UPDATE a comment
app.put('/comments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    const comment = comments.find(c => c.id === id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (!text) return res.status(400).json({ error: 'Text is required' });

    comment.text = text;
    res.json(comment);
});

// DELETE a comment
app.delete('/comments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Comment not found' });

    const deleted = comments.splice(index, 1);
    res.json(deleted[0]);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});