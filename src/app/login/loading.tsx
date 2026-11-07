export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
      <div role="status" aria-label="Carregando" className="h-[420px] w-[380px] max-w-full animate-pulse rounded-[18px] bg-card" />
    </div>
  );
}
