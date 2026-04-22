import { ConsumerShell } from "@/components/consumer-shell";

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell requireAuth={false}>{children}</ConsumerShell>;
}
