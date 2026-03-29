'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-zinc-200 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-800 mb-2">Sin conexión</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Esta página no está disponible offline. Vuelve a una sección que hayas visitado antes o
          espera a recuperar la conexión.
        </p>
        <button
          onClick={() => window.history.back()}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
