export interface PriceFinding {
    source: string;
    price: number;
    currency: string;
    url: string;
    title: string;
    image_url: string;
}

export interface PricingResult {
    low: number;
    high: number;
    average: number;
    findings: PriceFinding[];
}

export async function findItemPrices(imageUrl: string): Promise<PricingResult> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.error("SERPAPI_KEY is missing");
        throw new Error("Server configuration error");
    }

    try {
        const params = new URLSearchParams({
            engine: "google_lens",
            url: imageUrl,
            api_key: apiKey
        });

        // Use fetch for server-side request
        const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`SerpApi error: ${response.statusText}`);
        }

        const data = await response.json();
        const findings: PriceFinding[] = [];

        // 1. Process Visual Matches (usually the best source for "similar items")
        if (data.visual_matches) {
            console.log(`Found ${data.visual_matches.length} visual matches`);

            for (const match of data.visual_matches) {
                let priceValue = NaN;
                let currency = 'USD';

                // Case A: Structured price object (Best)
                if (match.price) {
                    if (match.price.value) {
                        priceValue = Number(match.price.value);
                    } else if (match.price.extracted_value) {
                        priceValue = Number(match.price.extracted_value);
                    }
                    if (match.price.currency) currency = match.price.currency;
                }

                // Case B: Try to extract from title if no price object (Fallback)
                if (isNaN(priceValue) && match.title) {
                    // very basic regex for $XX.XX
                    const priceMatch = match.title.match(/\$(\d{1,3}(,\d{3})*(\.\d{2})?)/);
                    if (priceMatch) {
                        priceValue = Number(priceMatch[1].replace(/,/g, ''));
                    }
                }

                if (!isNaN(priceValue) && priceValue > 0) {
                    findings.push({
                        source: match.source || 'Web',
                        price: priceValue,
                        currency: currency,
                        url: match.link,
                        title: match.title,
                        image_url: match.thumbnail
                    });
                }
            }
        }

        // 2. Fallback to extracting from knowledge graph if confident? (Maybe later)

        // Filter outliers or duplicates if needed
        const validFindings = findings.filter(f => f.price > 0).slice(0, 10); // Limit to top 10

        if (validFindings.length === 0) {
            // Return empty result rather than error
            return { low: 0, high: 0, average: 0, findings: [] };
        }

        const prices = validFindings.map(f => f.price);
        const low = Math.min(...prices);
        const high = Math.max(...prices);
        const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        return {
            low,
            high,
            average,
            findings: validFindings
        };

    } catch (error) {
        console.error("Error fetching price data:", error);
        // Fallback to empty for now so app doesn't crash on user
        return { low: 0, high: 0, average: 0, findings: [] };
    }
}

function extractPrice(priceString: string | undefined): number {
    if (!priceString) return NaN;
    // Remove symbols and convert to number
    const numeric = priceString.replace(/[^0-9.]/g, '');
    return Number(numeric);
}
