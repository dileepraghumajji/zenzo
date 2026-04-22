import { ConsumerShell } from "@/components/consumer-shell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
