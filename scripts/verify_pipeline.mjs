
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serpKey = process.env.SERPAPI_KEY;

if (!supabaseUrl || !supabaseKey || !serpKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Download a test image (Unsplash) to a buffer
const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"; // Real Vintage Camera

async function run() {
    console.log("=== PIPELINE VERIFICATION ===");

    try {
        // Step 1: Login (Anon) to allow upload
        const { data: auth, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) console.warn("Auth warning:", authError.message);
        const userId = auth?.user?.id;
        console.log(`User ID: ${userId}`);

        // Step 2: Download Test Image
        console.log("Downloading test image...");
        const imgRes = await fetch(TEST_IMAGE_URL);
        const buffer = await imgRes.arrayBuffer();

        // Step 3: Upload to Supabase
        const fileName = `debug_test_${Date.now()}.jpg`;
        const filePath = `${userId}/${fileName}`;
        console.log(`Uploading to ${filePath}...`);

        const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(filePath, buffer, { contentType: 'image/jpeg' });

        if (uploadError) {
            console.error("❌ Upload Failed:", uploadError);
            // If upload fails, we can't test Signed URL generation for OUR bucket.
            return;
        }
        console.log("✅ Upload Successful");

        // Step 4: Generate Signed URL
        console.log("Generating Signed URL...");
        const { data: signedData, error: signedError } = await supabase.storage
            .from('item-images')
            .createSignedUrl(filePath, 3600);

        if (signedError || !signedData?.signedUrl) {
            console.error("❌ Signed URL Generation Failed:", signedError);
            return;
        }

        const signedUrl = signedData.signedUrl;
        console.log("✅ Signed URL Generated (valid 1h)");
        // console.log(signedUrl); // Security: verify manually if needed

        // Step 5: Verify Accessibility (HTTP Check)
        const checkRes = await fetch(signedUrl, { method: 'HEAD' });
        console.log(`URL Reachability Check: Status ${checkRes.status}`);
        if (!checkRes.ok) {
            console.error("❌ Signed URL is NOT reachable by external fetch!");
        } else {
            console.log("✅ Signed URL is reachable.");
        }

        // Step 6: SerpApi Test (Google Lens)
        console.log("\n--- Testing Google Lens ---");
        const lensParams = new URLSearchParams({
            engine: "google_lens",
            url: signedUrl,
            api_key: serpKey
        });

        const lensRes = await fetch(`https://serpapi.com/search?${lensParams.toString()}`);
        const lensData = await lensRes.json();

        fs.writeFileSync('debug_lens_response.json', JSON.stringify(lensData, null, 2));
        console.log("Saved raw Lens response to 'debug_lens_response.json'");

        if (lensData.error) {
            console.error("❌ Lens API Error:", lensData.error);
        } else if (!lensData.visual_matches || lensData.visual_matches.length === 0) {
            console.error("❌ Lens returned 0 matches.");
        } else {
            console.log(`✅ Lens Success! Found ${lensData.visual_matches.length} matches.`);
            console.log("First match price:", lensData.visual_matches[0].price);
        }

        // Step 7: SerpApi Test (Reverse Image)
        console.log("\n--- Testing Google Reverse Image ---");
        const revParams = new URLSearchParams({
            engine: "google_reverse_image",
            image_url: signedUrl,
            api_key: serpKey
        });

        const revRes = await fetch(`https://serpapi.com/search?${revParams.toString()}`);
        const revData = await revRes.json();

        fs.writeFileSync('debug_reverse_response.json', JSON.stringify(revData, null, 2));
        console.log("Saved raw Reverse Image response to 'debug_reverse_response.json'");

        if (revData.error) {
            console.error("❌ Reverse Image API Error:", revData.error);
        } else {
            const blobs = revData.image_results || [];
            const shops = revData.shopping_results || [];
            console.log(`✅ Reverse Image Success! Found ${blobs.length} images, ${shops.length} shopping results.`);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

run();
