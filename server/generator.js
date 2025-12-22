const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateContentWithRetry(model, prompt, retries = 3, initialDelay = 5000) {
    let delay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            const msg = error.toString();
            if (msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("Quota exceeded")) {
                console.log(`[Gemini] Quota limit hit (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
    throw new Error("Max retries exceeded for AI generation due to quota limits.");
}

// Brainstorms ideas based on inputs using Gemini
async function generate(findings, context, apiKey) {
    console.log(`Generator creating ideas from ${findings.length} findings with Gemini`);

    if (!apiKey) {
        console.warn("No API Key provided. Returning mock data.");
        return [{
            title: "API Key Missing",
            description: "Please provide a valid Google Gemini API Key to generate real ideas.",
            feasibility: "Low",
            impact: "Low",
            findingId: "error"
        }];
    }

    try {
        console.log("Initializing Gemini Client...");
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        console.log(`Attempting to use model: ${modelName}`);

        const model = genAI.getGenerativeModel({ model: modelName });
        console.log("Model initialized successfully.");

        const findingsText = findings.map(f => `- ${f.title}: ${f.snippet} (Source: ${f.source})`).join("\n");

        const prompt = `
        You are an expert Innovation Consultant. Your task is to generate unique, high-value product or service ideas based on the following research findings about "${context}".
        
        RESEARCH FINDINGS:
        ${findingsText}
        
        INSTRUCTIONS:
        1. Analyze the findings to identify gaps, trends, or opportunities.
        2. Generate 3 distinct, innovative ideas that leverage these findings.
        3. For each idea, provide a Catchy Title, a Detailed Description of how it works and the value proposition, Feasibility (Low/Medium/High), and Impact (Low/Medium/High).
        4. Reference which finding inspired the idea if applicable.
        
        OUTPUT FORMAT (JSON ARRAY):
        [
            {
                "title": "...",
                "description": "...",
                "feasibility": "High",
                "impact": "Medium", 
                "analysis": "Brief comment on why this is good"
            }
        ]
        Return ONLY the JSON array. Do not use Markdown code blocks.
        `;

        console.log("Sending request to Gemini...");
        const result = await generateContentWithRetry(model, prompt);

        const response = await result.response;
        let text = response.text();
        console.log("AI Response received.");

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let ideas;
        try {
            ideas = JSON.parse(text);
        } catch (e) {
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                ideas = JSON.parse(text.substring(start, end + 1));
            } else {
                throw new Error("Invalid JSON format from AI");
            }
        }

        return ideas.map(idea => ({
            ...idea,
            score: Math.floor(Math.random() * 20) + 80
        }));

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return [{
            title: "Generation Failed",
            description: "Could not generate ideas with AI. " + error.message,
            feasibility: "None",
            impact: "None",
            findingId: "error"
        }];
    }
}

module.exports = { generate };
