import AdminPlatformControl from "@/components/admin/AdminPlatformControl";

type PageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function AdminPlatformControlPage({ searchParams }: PageProps) {
  const { section } = await searchParams;
  return <AdminPlatformControl focusSection={section ?? null} />;
}
