import { AppShellSkeleton } from "../../components/ui/page-skeletons";

export default function ChatLoading() {
  return (
    <AppShellSkeleton
      title="Private chat"
      subtitle="Loading your match conversations."
    />
  );
}
