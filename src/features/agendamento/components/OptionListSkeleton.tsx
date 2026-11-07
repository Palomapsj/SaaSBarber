// Pulsing card placeholders used while a booking step's options load.
export function OptionListSkeleton({ count, cardHeight }: { count: number; cardHeight: number }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="content-width grid animate-pulse gap-2.5 px-5 py-[18px] md:grid-cols-2 md:gap-3 md:px-8"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-[14px] bg-card" style={{ height: cardHeight }} />
      ))}
    </div>
  );
}
