// Multi-tenant layout — all dashboard routes live under /:tenantSlug
export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
