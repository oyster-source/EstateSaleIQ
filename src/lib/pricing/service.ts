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

        // 1. Process Visual Matches (Google Lens)
        if (data.visual_matches && data.visual_matches.length > 0) {
            processMatches(data.visual_matches, findings);
        }

        // 2. FALLBACK: If no findings, try Google Reverse Image (better for some items)
        if (findings.length === 0) {
            console.log("No Lens matches found. Switch to Reverse Image Search...");
            const fallbackParams = new URLSearchParams({
                engine: "google_reverse_image",
                image_url: imageUrl, // Uses 'image_url' param
                api_key: apiKey
            });
            const fallbackRes = await fetch(`https://serpapi.com/search?${fallbackParams.toString()}`);
            if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                // Reverse image often puts matches in 'image_results' or 'inline_images'
                if (fallbackData.image_results) {
                    processMatches(fallbackData.image_results, findings);
                }
                if (fallbackData.shopping_results) {
                    processMatches(fallbackData.shopping_results, findings);
                }
            }
        }

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

function processMatches(matches: any[], findings: PriceFinding[]) {
    for (const match of matches) {
        let priceValue = NaN;
        let currency = 'USD';

        // Case A: Structured price object (Best)
        if (match.price) {
            // Check extracted_value first as it's usually cleaner
            if (match.price.extracted_value) {
                priceValue = Number(match.price.extracted_value);
            } else if (match.price.value) {
                // Parse "AED 500*" or "$10.00"
                priceValue = extractPrice(match.price.value);
            }
            if (match.price.currency) currency = match.price.currency;
        }

        // Case B: Try to extract from title if no price object (Fallback)
        if (isNaN(priceValue) && match.title) {
            priceValue = extractPrice(match.title);
        }

        if (!isNaN(priceValue) && priceValue > 0) {
            findings.push({
                source: match.source || 'Web',
                price: priceValue,
                currency: currency,
                url: match.link || match.link_url, // some engines use link_url
                title: match.title,
                image_url: match.thumbnail || match.image // some use image
            });
        }
    }
}
