
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("=== CHECKING RECENT ITEMS ===");

    const { data: items, error } = await supabase
        .from('items')
        .select(`
            id, 
            created_at, 
            search_status, 
            description,
            image_url
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching items:", error);
        return;
    }

    if (!items || items.length === 0) {
        console.log("No items found.");
        return;
    }

    console.log(`Found ${items.length} recent items:`);

    for (const item of items) {
        console.log(`\nID: ${item.id}`);
        console.log(`Created: ${new Date(item.created_at).toLocaleTimeString()}`);
        console.log(`Status: ${item.search_status}`);
        console.log(`Image: ${item.image_url.substring(0, 50)}...`);

        // Get findings count
        const { count, error: countError } = await supabase
            .from('price_findings')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', item.id);

        if (countError) console.error("Error counting findings:", countError);
        else console.log(`Findings Count: ${count}`);
    }
}

run();
