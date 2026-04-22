import { ConsumerShell } from "@/components/consumer-shell";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
