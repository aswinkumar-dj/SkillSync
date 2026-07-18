import { AppShellSkeleton } from "../../../components/ui/page-skeletons";

export default function ChatRoomLoading() {
  return (
    <AppShellSkeleton
      title="Private chat"
      subtitle="Loading conversation history."
    />
  );
}
