import AIServiceWorkspace from "@/components/workspace/ai/AIServiceWorkspace";

type PageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function AdminAIServicePage({ searchParams }: PageProps) {
  const { section } = await searchParams;
  return <AIServiceWorkspace mode="admin" initialTab={section === "models" ? "models" : undefined} />;
}
