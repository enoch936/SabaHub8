import AdminSecurityGovernance from "@/components/admin/AdminSecurityGovernance";

type PageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function AdminSecurityGovernancePage({ searchParams }: PageProps) {
  const { section } = await searchParams;
  return <AdminSecurityGovernance focusSection={section ?? null} />;
}
