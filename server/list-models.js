
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './server.env' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("API Key not found in .env");
        process.exit(1);
    }

    try {
        // The SDK doesn't always expose listModels on the main client in older versions, 
        // but let's try to access the model manager if possible or make a direct REST call if SDK fails.
        // Direct REST call is often safer for debugging environment issues.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or different format:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
