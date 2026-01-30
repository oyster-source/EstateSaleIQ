
// import 'dotenv/config'; removed, using node --env-file

const apiKey = process.env.SERPAPI_KEY;

if (!apiKey) {
    console.error("No SERPAPI_KEY found in environment.");
    process.exit(1);
}

console.log(`Testing SerpApi with key: ${apiKey.substring(0, 5)}...`);

const testUrl = "https://i.imgur.com/8Bq2d6o.jpeg"; // Sample image
const params = new URLSearchParams({
    engine: "google_lens",
    url: testUrl,
    api_key: apiKey
});

async function run() {
    try {
        console.log("Fetching from SerpApi...");
        const res = await fetch(`https://serpapi.com/search?${params.toString()}`);
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.error("Response:", await res.text());
            return;
        }

        const data = await res.json();
        console.log("Visual matches found:", data.visual_matches?.length || 0);

        if (data.visual_matches && data.visual_matches.length > 0) {
            console.log("First match:", data.visual_matches[0].title);
        } else {
            console.log("No matches found, but API worked.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
