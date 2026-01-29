'use client';

import { useState, useRef } from 'react';
import { HoneycombButton } from './ui/HoneycombButton';
import { createClient } from '@/lib/supabase/client';

export function UploadScanner() {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploading(true);

        try {
            // 0. Ensure Auth (Anonymous)
            const { data: { session } } = await supabase.auth.getSession();
            let userId = session?.user?.id;

            if (!userId) {
                const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
                if (authError) {
                    console.warn("Anonymous auth failed, trying to proceed but might fail DB constraint:", authError);
                    // Fallback: This will fail DB insert if RLS/schema enforces it, but let's try.
                }
                userId = authData?.user?.id;
            }

            // 1. Upload image to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('item-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('item-images')
                .getPublicUrl(filePath);

            // 2. Create item record in database
            if (!userId) {
                alert("Please sign in to save items.");
                // For demo purposes, we might stop here or mock it.
                // allowing failure to propagate
            }

            const { data: newItem, error: dbError } = await supabase
                .from('items')
                .insert({
                    user_id: userId, // This must be a valid auth.users ID
                    image_url: publicUrl,
                    search_status: 'pending'
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Redirect to item page
            window.location.href = `/items/${newItem.id}`;

        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error uploading or saving item. Check console for details.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-8 border border-gold-800/30 rounded-3xl bg-honey-grid/20 backdrop-blur-sm max-w-md w-full mx-auto animate-fade-in">
            <div
                className="w-64 h-64 border-2 border-dashed border-gold-600/50 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-gold-500 transition-colors cursor-pointer bg-black/20"
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-4 text-gold-500 opacity-50 group-hover:opacity-100 transition-opacity">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-gold-400 font-medium">Click to Upload Photo</p>
                        <p className="text-xs text-gray-500 mt-2">or take a picture</p>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                capture="environment"
                className="hidden"
            />

            <HoneycombButton
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={uploading}
            >
                {uploading ? 'Processing...' : previewUrl ? 'Retake Photo' : 'Select Photo'}
            </HoneycombButton>
        </div>
    );
}
