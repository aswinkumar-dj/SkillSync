import { AppShellSkeleton } from "../../components/ui/page-skeletons";

export default function RequestsLoading() {
  return (
    <AppShellSkeleton
      title="Match requests"
      subtitle="Loading incoming and outgoing invitations."
    />
  );
}
