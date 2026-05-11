import ProposalQueueWorkspace from "@/components/workspace/proposals/ProposalQueueWorkspace";

type ProposalQueuePageProps = {
  params: Promise<{ jobId: string }>;
};

export default async function ProposalQueuePage({ params }: ProposalQueuePageProps) {
  const { jobId } = await params;
  return <ProposalQueueWorkspace jobId={decodeURIComponent(jobId)} />;
}
