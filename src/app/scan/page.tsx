import { UploadScanner } from "@/components/UploadScanner";

export default function ScanPage() {
    return (
        <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-gold-400 to-gold-600">
                    Scan Item
                </h1>
                <p className="text-gray-400">Upload a clear photo of the item you want to price.</p>
            </div>

            <UploadScanner />
        </main>
    );
}
