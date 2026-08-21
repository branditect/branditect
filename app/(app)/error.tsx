"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-lg font-medium text-ink mb-2">Something went wrong</h2>
        <p className="text-sm text-muted mb-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-brand-orange text-white rounded-md text-sm hover:bg-brand-orange-hover transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
