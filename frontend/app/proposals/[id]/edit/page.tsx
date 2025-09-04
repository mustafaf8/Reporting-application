import EditProposalPage from "@/components/features/proposals/EditProposalPage";

interface EditProposalProps {
  params: {
    id: string;
  };
}

export default function EditProposal({ params }: EditProposalProps) {
  return <EditProposalPage proposalId={params.id} />;
}
