'use server';

import { createClient } from '@/lib/supabase/client'; // This might need a server-safe client if using cookies, but for anon it's ok-ish or use createServerClient
import { findItemPrices } from '@/lib/pricing/service';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get server client
async function getSupabase() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Server Actions can set cookies
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    );
}


export async function analyzeItemPricing(itemId: string) {
    const supabase = await getSupabase();

    try {
        // 1. Fetch item
        const { data: item, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error || !item) {
            throw new Error('Item not found');
        }

        // 2. Perform search
        console.log(`Analyzing item ${itemId} with image: ${item.image_url}`);
        const result = await findItemPrices(item.image_url);
        console.log(`Found ${result.findings.length} matches`);

        // 3. Save findings (only if we have any)
        if (result.findings.length > 0) {
            const findingsPayload = result.findings.map(f => ({
                item_id: itemId,
                source: f.source,
                price: f.price,
                currency: f.currency,
                url: f.url,
                title: f.title,
                image_url: f.image_url
            }));

            const { error: insertError } = await supabase
                .from('price_findings')
                .insert(findingsPayload);

            if (insertError) {
                console.error('Failed to save findings:', insertError);
                throw insertError;
            }
        }

        // 4. Update item status to completed
        const { error: updateError } = await supabase
            .from('items')
            .update({ search_status: 'completed' })
            .eq('id', itemId);

        if (updateError) {
            console.error("Failed to update status to completed:", updateError);
            throw updateError;
        }

        return result;

    } catch (error) {
        console.error("Analysis Error:", error);

        // Update status to failed so it doesn't get stuck
        const { error: failUpdateError } = await supabase
            .from('items')
            .update({ search_status: 'failed' })
            .eq('id', itemId);

        if (failUpdateError) {
            console.error("Failed to update status to failed:", failUpdateError);
        }

        throw error;
    }
}
