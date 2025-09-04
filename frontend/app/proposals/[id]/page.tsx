import ProposalDetailPage from "@/components/features/proposals/ProposalDetailPage";

interface ProposalDetailProps {
  params: {
    id: string;
  };
}

export default function ProposalDetail({ params }: ProposalDetailProps) {
  return <ProposalDetailPage proposalId={params.id} />;
}
