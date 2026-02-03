
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serpKey = process.env.SERPAPI_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Connecting to Supabase...");

    // Get latest item
    const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error("Error fetching items:", error);
        return;
    }

    if (!items || items.length === 0) {
        console.log("No items found in DB to test.");
        return;
    }

    const item = items[0];
    console.log(`Latest Item ID: ${item.id}`);
    console.log(`Image URL: ${item.image_url}`);

    // Test reachability
    try {
        console.log("Testing URL reachability...");
        const res = await fetch(item.image_url, { method: 'HEAD' });
        console.log(`HTTP Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.error("❌ Image URL is NOT accessible!");
        } else {
            console.log("✅ Image URL is accessible.");
        }

    } catch (e) {
        console.error("Error fetching URL:", e);
    }

    // Optional: Test SerpApi with THIS url specifically
    if (serpKey) {
        console.log("\nTesting SerpApi with this specific URL...");
        const params = new URLSearchParams({
            engine: "google_lens",
            url: item.image_url,
            api_key: serpKey,
            hl: "en",
            gl: "us"
        });

        const serpRes = await fetch(`https://serpapi.com/search?${params.toString()}`);
        const serpData = await serpRes.json();

        if (serpData.error) {
            console.error("❌ SerpApi Error:", serpData.error);
        } else if (!serpData.visual_matches || serpData.visual_matches.length === 0) {
            console.error("❌ SerpApi returned 0 matches.");
            console.log("Lens URL:", serpData.search_metadata?.google_lens_url);
        } else {
            console.log(`✅ SerpApi Success! Found ${serpData.visual_matches.length} matches.`);
        }
    }
}

run();
