import { AppShellSkeleton } from "../../components/ui/page-skeletons";

export default function MatchesLoading() {
  return (
    <AppShellSkeleton
      title="Your matches"
      subtitle="Loading private practice relationships."
    />
  );
}
