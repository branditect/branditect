"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h2 className="text-lg font-medium text-ink mb-2">Something went wrong</h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#E8562A] text-white rounded-md text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
