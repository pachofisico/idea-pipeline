const axios = require('axios');
const cheerio = require('cheerio');

async function search(query) {
    console.log(`Researcher searching for: ${query}`);

    try {
        // Use DuckDuckGo HTML version which is easier to scrape and doesn't require JS
        const url = 'https://html.duckduckgo.com/html/';
        const params = new URLSearchParams();
        params.append('q', query);

        const response = await axios.post(url, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.result').each((i, element) => {
            if (results.length >= 6) return false; // Limit to 6 results

            const titleElement = $(element).find('.result__title .result__a');
            const snippetElement = $(element).find('.result__snippet');
            const urlElement = $(element).find('.result__url');

            const title = titleElement.text().trim();
            const url = titleElement.attr('href');
            const snippet = snippetElement.text().trim();

            if (title && url) {
                // Determine source from URL
                let source = "Web";
                try {
                    // Url might be relative or full
                    const decodedUrl = decodeURIComponent(url);
                    // Sometimes DDG returns /uddg?url=...
                    if (decodedUrl.includes('uddg?url=')) {
                        const realUrl = decodedUrl.split('uddg?url=')[1].split('&')[0];
                        source = new URL(realUrl).hostname.replace('www.', '');
                    } else {
                        source = new URL(url).hostname.replace('www.', '');
                    }
                } catch (e) {
                    // keep default
                }

                results.push({
                    id: i + 1,
                    type: 'web_finding',
                    title: title,
                    snippet: snippet || "No description available.",
                    url: url,
                    source: source
                });
            }
        });

        if (results.length === 0) {
            console.log("No results found parsing HTML.");
            return [];
        }

        return results;

    } catch (error) {
        console.error("Search failed:", error.message);
        return [
            {
                id: 1,
                type: 'error',
                title: 'Search Connection Error',
                snippet: 'Could not connect to search provider. Please check your internet connection.',
                url: '#',
                source: 'System'
            }
        ];
    }
}

module.exports = { search };
