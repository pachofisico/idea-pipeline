require('dotenv').config({ path: './server.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No API Key found in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // We use the same 'getGenerativeModel' but usually there is a listModels method on the client or manager?
        // The SDK doesn't expose listModels directly on the main class easily in all versions.
        // Let's try to just invoke a known working model blindly or update the model mapping.

        console.log("Checking model availability...");
        // Actually, usually gemini-1.5-flash IS correct.
        // Let's try 'gemini-1.5-flash-001'
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash-8b works!");
        } catch (e) { console.log("gemini-1.5-flash-8b failed: " + e.message) }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash works!");
        } catch (e) { console.log("gemini-1.5-flash failed: " + e.message) }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkModels();
