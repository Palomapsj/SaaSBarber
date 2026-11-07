import { PanelShell } from "@/components/layout/PanelShell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <PanelShell role="admin">{children}</PanelShell>;
}