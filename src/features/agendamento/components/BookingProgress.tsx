export const BOOKING_STEP_COUNT = 5;

// Five dots under the step header; only the current step is highlighted (as in the prototype).
export function BookingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex justify-center gap-[5px] px-6 pt-2.5">
      <span className="sr-only">
        Passo {currentStep} de {BOOKING_STEP_COUNT}
      </span>
      {Array.from({ length: BOOKING_STEP_COUNT }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`h-1.5 rounded-full ${index + 1 === currentStep ? "w-[18px] bg-accent" : "w-1.5 bg-border"}`}
        />
      ))}
    </div>
  );
}
