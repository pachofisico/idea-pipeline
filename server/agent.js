const researcher = require('./researcher');
const generator = require('./generator');
const evaluator = require('./evaluator');

async function processRequest(query) {
    console.log(`Agent Received Query: ${query}`);

    // Step 1: Research
    // The agent decides to research based on the query.
    const findings = await researcher.search(query);

    return {
        stage: 'findings',
        message: 'Research complete. Please select findings to generate ideas.',
        data: findings
    };
}

async function generateIdeasDetails(selectedFindings, context, apiKey) {
    console.log(`Agent Generating Ideas for selected items`);

    // Step 2: Generate
    // We pass apiKey to the generator
    const rawIdeas = await generator.generate(selectedFindings, context, apiKey);

    // Step 3: Evaluate
    // We can keep using the evaluator or let the generator handle scores.
    // For this update, we will simply return the rawIdeas which now contain scores from the generator wrapper.
    return rawIdeas;
}

module.exports = { processRequest, generateIdeasDetails };
