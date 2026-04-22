import { ConsumerShell } from "@/components/consumer-shell";

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
