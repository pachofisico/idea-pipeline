require('dotenv').config({ path: './server.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const agent = require('./agent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Main endpoint to start the process
app.post('/api/start', async (req, res) => {
    const { query } = req.body;
    try {
        const result = await agent.processRequest(query);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to interact with findings (Generate ideas from specific findings)
app.post('/api/generate-ideas', async (req, res) => {
    const { selectedFindings, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const ideas = await agent.generateIdeasDetails(selectedFindings, context, apiKey);
        res.json({ ideas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating ideas' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
