// Evaluates and grades ideas
async function evaluate(ideas) {
    console.log(`Evaluator grading ${ideas.length} ideas`);

    return ideas.map(idea => {
        const score = Math.floor(Math.random() * 40) + 60; // 60-100
        let analysis = "Solid idea with market potential.";
        if (score > 90) analysis = "Game changer. Must pursue.";
        else if (score < 70) analysis = "Good but needs refinement.";

        return {
            ...idea,
            score,
            analysis
        };
    }).sort((a, b) => b.score - a.score);
}

module.exports = { evaluate };
