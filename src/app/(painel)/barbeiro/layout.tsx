import { PanelShell } from "@/components/layout/PanelShell";

export default function BarberLayout({ children }: LayoutProps<"/barbeiro">) {
  return <PanelShell role="barber">{children}</PanelShell>;
}