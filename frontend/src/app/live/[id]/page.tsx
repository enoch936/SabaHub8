import { LiveViewerWorkspace } from "@/components/stream/LiveViewerWorkspace";

export default async function LiveStreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveViewerWorkspace streamId={id} />;
}
