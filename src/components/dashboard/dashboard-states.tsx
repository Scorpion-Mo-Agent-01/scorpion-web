export function LoadingScreen() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🦂</div>
                <p className="text-lg font-mono">Initializing Obsidian Control...</p>
            </div>
        </div>
    );
}

export function ErrorScreen({ error }: { error: string }) {
    return (
        <div className="min-h-screen bg-slate-950 text-red-500 flex items-center justify-center">
            <div className="text-center">
                <p className="text-xl font-bold mb-2">System Error</p>
                <p className="text-sm text-zinc-400">Error: {error}</p>
            </div>
        </div>
    );
}
