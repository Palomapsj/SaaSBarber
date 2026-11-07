// Runs only during the initial HTML parse. On the client it renders as text/plain so React
// does not warn about script tags (pattern from the Next.js "preventing flash" guide).
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
