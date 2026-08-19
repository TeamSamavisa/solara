export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--solara-600)] rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
