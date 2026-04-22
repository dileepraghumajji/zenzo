import { ConsumerShell } from "@/components/consumer-shell";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsumerShell>{children}</ConsumerShell>;
}
