
import fs from 'fs';

const apiKey = process.env.SERPAPI_KEY;

if (!apiKey) {
    console.error("No SERPAPI_KEY found in environment.");
    process.exit(1);
}

console.log(`Testing SerpApi with key: ${apiKey.substring(0, 5)}...`);

// Simple, public chair image from Unsplash
const testUrl = "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";

const params = new URLSearchParams({
    engine: "google_lens",
    url: testUrl,
    api_key: apiKey,
    hl: "en",
    gl: "us"
});


async function run() {
    try {
        console.log("Fetching from SerpApi (google_reverse_image)...");
        const res = await fetch(`https://serpapi.com/search?${params.toString()}`);
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.error("Response:", await res.text());
            return;
        }

        const data = await res.json();

        // Write full debug log
        fs.writeFileSync('serp-debug-treadmill.json', JSON.stringify(data, null, 2));
        console.log("Saved full response to serp-debug-treadmill.json");

        console.log("Visual matches (image_results?):", data.image_results?.length || 0);
        console.log("Shopping results (inline?):", data.shopping_results?.length || 0);

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
