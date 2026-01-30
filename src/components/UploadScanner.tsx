'use client';

import { useState, useRef } from 'react';
import { HoneycombButton } from './ui/HoneycombButton';
import { createClient } from '@/lib/supabase/client';
import JSZip from 'jszip';
import { useRouter } from 'next/navigation';

export function UploadScanner() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        setProgress({ current: 0, total: 0 }); // Init

        try {
            // 0. Ensure Auth
            const { data: { session } } = await supabase.auth.getSession();
            let userId = session?.user?.id;

            if (!userId) {
                const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
                if (authError) {
                    console.warn("Anonymous auth failed:", authError);
                }
                userId = authData?.user?.id;
            }

            if (!userId) {
                alert("Please sign in to save items.");
                setUploading(false);
                return;
            }

            // 1. Process Files (Unzip if needed)
            const rawFiles = Array.from(e.target.files);
            const filesToUpload: File[] = [];

            for (const file of rawFiles) {
                if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                    try {
                        const zip = new JSZip();
                        const zipContent = await zip.loadAsync(file);

                        for (const relativePath in zipContent.files) {
                            const zipEntry = zipContent.files[relativePath];
                            if (!zipEntry.dir && !relativePath.startsWith('__MACOSX') && !relativePath.startsWith('.')) {
                                // check extensions
                                if (relativePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                                    const blob = await zipEntry.async('blob');
                                    const extractedFile = new File([blob], relativePath.split('/').pop() || 'image.jpg', { type: 'image/jpeg' });
                                    filesToUpload.push(extractedFile);
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error unzip:", err);
                        alert(`Failed to unzip ${file.name}`);
                    }
                } else {
                    filesToUpload.push(file);
                }
            }

            if (filesToUpload.length === 0) {
                alert("No valid images found.");
                setUploading(false);
                return;
            }

            // Update preview if single file
            if (filesToUpload.length === 1) {
                setPreviewUrl(URL.createObjectURL(filesToUpload[0]));
            } else {
                setPreviewUrl(null); // Or show a stack icon
            }

            setProgress({ current: 0, total: filesToUpload.length });

            // 2. Upload Loop
            const createdItemIds: string[] = [];

            for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];

                // Upload to Storage
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${userId}/${Date.now()}_${fileName}`; // Organize by user/time to avoid collision

                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error(`Failed to upload ${file.name}:`, uploadError);
                    continue; // Skip this one
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(filePath);

                // Create DB Record
                const { data: newItem, error: dbError } = await supabase
                    .from('items')
                    .insert({
                        user_id: userId,
                        image_url: publicUrl,
                        search_status: 'pending'
                    })
                    .select()
                    .single();

                if (dbError) {
                    console.error(`Failed to create item for ${file.name}:`, dbError);
                } else {
                    createdItemIds.push(newItem.id);
                }

                setProgress({ current: i + 1, total: filesToUpload.length });
            }

            // 3. Redirect
            if (createdItemIds.length === 1) {
                router.push(`/items/${createdItemIds[0]}`);
            } else if (createdItemIds.length > 1) {
                router.push('/items');
            } else {
                alert("No items were successfully uploaded.");
            }

        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error uploading. Check console.');
        } finally {
            setUploading(false);
            setProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-8 border border-gold-800/30 rounded-3xl bg-honey-grid/20 backdrop-blur-sm max-w-md w-full mx-auto animate-fade-in">
            <div
                className="w-64 h-64 border-2 border-dashed border-gold-600/50 rounded-2xl flex items-center justify-center relative overflow-hidden group hover:border-gold-500 transition-colors cursor-pointer bg-black/20"
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                {previewUrl && !uploading ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-4 text-gold-500 opacity-50 group-hover:opacity-100 transition-opacity">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-gold-400 font-medium">Click to Upload</p>
                        <p className="text-xs text-gray-500 mt-2">Photos or Zip files</p>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                        {progress && progress.total > 0 && (
                            <p className="text-gold-400 font-bold text-lg">
                                Processing {progress.current} / {progress.total}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.zip,application/zip,application/x-zip-compressed"
                multiple
                className="hidden"
            />

            <HoneycombButton
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={uploading}
            >
                {uploading ? 'Processing...' : previewUrl ? 'Scan More' : 'Select Photos or Zip'}
            </HoneycombButton>

            <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP, and ZIP archives</p>
        </div>
    );
}
