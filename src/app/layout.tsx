import type { Metadata } from "next";
import { Oswald, Work_Sans } from "next/font/google";
import { InlineScript } from "@/components/ui/InlineScript";
import { DEFAULT_THEME, themeInitScript } from "@/lib/theme/theme";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Agendamento",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme={DEFAULT_THEME}
      className={`${oswald.variable} ${workSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
