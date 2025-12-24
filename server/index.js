require('dotenv').config({ path: './server.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const agent = require('./agent');
const { initDB, User, Idea, Finding } = require('./database');
const storageManager = require('./storage_manager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Initialize DB and Storage
initDB();
storageManager.initializeStorage();

// Multer storage for uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, cb) => {
            const { userId, ideaId } = req.params;
            const type = file.mimetype.startsWith('video/') ? 'videos' : 'images';
            const dest = path.join(storageManager.STORAGE_ROOT, userId, ideaId, type);
            await fs.ensureDir(dest);
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    }),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// --- API ENDPOINTS ---

// Get User (Mocked for now)
app.get('/api/user/default', async (req, res) => {
    try {
        const user = await User.findOne({ where: { name: 'Francisco Javier Martínez' } });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Portafolio
app.get('/api/ideas', async (req, res) => {
    const { folder, trashed } = req.query;
    try {
        const where = { isTrash: trashed === 'true' };
        if (folder) where.folder = folder;

        const ideas = await Idea.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        // Enrich with media for thumbnails
        const enrichedIdeas = await Promise.all(ideas.map(async (idea) => {
            const files = await storageManager.getIdeaFiles(idea.userId, idea.id);
            return {
                ...idea.toJSON(),
                hasMedia: files.images.length > 0 || files.videos.length > 0,
                thumb: files.images.length > 0 ? `/storage/${idea.userId}/${idea.id}/images/${files.images[0]}` : null,
                videoThumb: files.videos.length > 0 ? `/storage/${idea.userId}/${idea.id}/videos/${files.videos[0]}` : null
            };
        }));

        res.json(enrichedIdeas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save Idea
app.post('/api/ideas', async (req, res) => {
    const { userId, title, subtitle, description, sketch, score, feasibility, impact, analysis, strategy, folder, findings } = req.body;
    try {
        const newIdea = await Idea.create({
            userId, title, subtitle, description,
            sketch: typeof sketch === 'string' ? sketch : JSON.stringify(sketch),
            score, feasibility, impact, analysis, strategy, folder: folder || 'General'
        });

        // Prepare storage
        await storageManager.saveIdeaMetadata(userId, newIdea.id, { title: title || newIdea.title, description, createdAt: new Date() });

        if (findings && findings.length > 0) {
            await Promise.all(findings.map(f =>
                Finding.create({
                    title: f.title,
                    snippet: f.snippet,
                    url: f.url,
                    source: f.source,
                    ideaId: newIdea.id
                })
            ));
        }

        res.json(newIdea);
    } catch (error) {
        console.error("Save Idea Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update Idea
app.put('/api/ideas/:id', async (req, res) => {
    const { title, subtitle, description, sketch, status, strategy, folder, isTrash, patentDraft, journal } = req.body;
    try {
        const idea = await Idea.findByPk(req.params.id);
        if (!idea) return res.status(404).json({ error: 'Not found' });

        await idea.update({ title, subtitle, description, sketch, status, strategy, folder, isTrash, patentDraft, journal });

        // Update JSON file
        await storageManager.saveIdeaMetadata(idea.userId, idea.id, {
            title: idea.title,
            description: idea.description,
            updatedAt: new Date()
        });

        res.json(idea);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Idea (Soft or Hard)
app.delete('/api/ideas/:id', async (req, res) => {
    const { permanent } = req.query;
    try {
        const idea = await Idea.findByPk(req.params.id);
        if (!idea) return res.status(404).json({ error: 'Not found' });

        if (permanent === 'true') {
            await idea.destroy();
            // Optional: clean up files?
            res.json({ message: 'Permanently deleted' });
        } else {
            await idea.update({ isTrash: true });
            res.json({ message: 'Moved to trash' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Idea Detail (DB + File paths)
app.get('/api/ideas/:id', async (req, res) => {
    try {
        const idea = await Idea.findByPk(req.params.id, {
            include: [{ model: Finding, as: 'findings' }]
        });
        if (!idea) return res.status(404).json({ error: 'Idea not found' });

        const files = await storageManager.getIdeaFiles(idea.userId, idea.id);

        res.json({
            ...idea.toJSON(),
            media: {
                videos: files.videos.map(v => `/storage/${idea.userId}/${idea.id}/videos/${v}`),
                images: files.images.map(i => `/storage/${idea.userId}/${idea.id}/images/${i}`)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload Media (Multiple)
app.post('/api/ideas/:userId/:ideaId/upload', upload.array('files', 50), (req, res) => {
    const fileCount = req.files ? req.files.length : 0;
    res.json({ message: `${fileCount} files uploaded`, files: req.files ? req.files.map(f => f.filename) : [] });
});

// Others...
app.post('/api/start', async (req, res) => {
    const { query } = req.body;
    console.log(`[POST /api/start] Received query: ${query}`);
    try {
        const result = await agent.processRequest(query);
        console.log(`[POST /api/start] Success. Found ${result.data?.length || 0} findings.`);
        res.json(result);
    } catch (error) {
        console.error(`[POST /api/start] ERROR:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/generate-ideas', async (req, res) => {
    const { selectedFindings, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[POST /api/generate-ideas] Context: ${context}, Selected: ${selectedFindings?.length}`);
    try {
        const ideas = await agent.generateIdeasDetails(selectedFindings, context, apiKey);
        console.log(`[POST /api/generate-ideas] Success. Generated ${ideas?.length || 0} ideas.`);
        res.json({ ideas });
    } catch (error) {
        console.error(`[POST /api/generate-ideas] ERROR:`, error);
        res.status(500).json({ error: 'Error generating ideas' });
    }
});

app.post('/api/random-innovation', async (req, res) => {
    console.log(`[POST /api/random-innovation] Triggered`);
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const topic = await agent.generateRandomTopic(apiKey);
        console.log(`[POST /api/random-innovation] Topic suggested: ${topic}`);
        const result = await agent.processRequest(topic);
        console.log(`[POST /api/random-innovation] Success. Returning topic and ${result.data?.length || 0} findings.`);
        res.json({ topic, findings: result.data });
    } catch (error) {
        console.error(`[POST /api/random-innovation] ERROR:`, error);
        res.status(500).json({ error: 'Fail' });
    }
});

app.post('/api/ideas/:id/draft-patent', async (req, res) => {
    try {
        const idea = await Idea.findByPk(req.params.id);
        if (!idea) return res.status(404).json({ error: 'Not found' });

        const draft = await agent.generatePatent(idea, process.env.GEMINI_API_KEY);
        await idea.update({ patentDraft: draft });
        res.json({ draft });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ideas/:id/generate-image', async (req, res) => {
    try {
        const idea = await Idea.findByPk(req.params.id);
        if (!idea) return res.status(404).json({ error: 'Not found' });

        const prompt = await agent.generateVisualPrompt(idea, process.env.GEMINI_API_KEY);
        const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}&model=flux`;

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imgName = `ai_gen_${Date.now()}.jpg`;
        const storagePath = path.join(__dirname, 'storage', idea.userId, idea.id, 'images');
        await fs.ensureDir(storagePath);
        await fs.writeFile(path.join(storagePath, imgName), response.data);

        res.json({ success: true, url: `/storage/${idea.userId}/${idea.id}/images/${imgName}` });
    } catch (error) {
        console.error("Image Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
