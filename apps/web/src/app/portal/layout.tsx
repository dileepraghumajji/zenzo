import { ConsumerShell } from "@/components/consumer-shell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
