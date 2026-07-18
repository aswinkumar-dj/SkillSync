import { Skeleton, SkeletonBlock, SkeletonText } from "./skeleton";

export function AppShellSkeleton({
  title = "Loading workspace",
  subtitle = "Restoring your session and preparing this page.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="grid gap-5 border-b border-white/5 pb-6 lg:grid-cols-[220px_1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300">
              SkillSync
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-text">{title}</p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
          <div className="flex items-center gap-3 justify-self-start lg:justify-self-end">
            <Skeleton className="h-11 w-20 rounded-[16px]" />
            <Skeleton className="h-14 w-40 rounded-[18px]" />
            <Skeleton className="h-11 w-24 rounded-[16px]" />
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-[22px] bg-white/[0.035] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-[14px]" />
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <ContentCardsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index}>
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-[15px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 rounded-[12px]" />
          </div>
          <div className="mt-5">
            <SkeletonText lines={3} />
          </div>
          <div className="mt-5 flex gap-3">
            <Skeleton className="h-11 w-28 rounded-[14px]" />
            <Skeleton className="h-11 w-24 rounded-[14px]" />
          </div>
        </SkeletonBlock>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-[15px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-3 w-28 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
          <div className="mt-4">
            <SkeletonText lines={2} />
          </div>
        </SkeletonBlock>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
      <SkeletonBlock className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-[18px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-full" />
            <Skeleton className="h-3 w-36 rounded-full" />
          </div>
        </div>
        <div className="mt-6">
          <SkeletonText lines={4} />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-20 rounded-[10px]" />
            ))}
          </div>
        </div>
      </SkeletonBlock>

      <div className="space-y-4">
        <SkeletonBlock>
          <Skeleton className="h-3 w-24 rounded-full" />
          <div className="mt-4">
            <SkeletonText lines={3} />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-24 rounded-[10px]" />
            <Skeleton className="h-7 w-20 rounded-[10px]" />
          </div>
        </SkeletonBlock>
        <SkeletonBlock className="bg-[#140f0c]">
          <Skeleton className="h-3 w-24 rounded-full" />
          <div className="mt-4">
            <SkeletonText lines={4} />
          </div>
          <Skeleton className="mt-5 h-11 w-36 rounded-[14px]" />
        </SkeletonBlock>
      </div>
    </div>
  );
}

export function ChatRoomSkeleton() {
  return (
    <div className="flex min-h-[70vh] flex-col rounded-[22px] bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[15px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-[12px]" />
          <Skeleton className="h-8 w-24 rounded-[12px]" />
        </div>
      </div>

      <div className="flex-1 space-y-3 px-5 py-5">
        <div className="flex justify-start">
          <Skeleton className="h-16 w-64 rounded-[16px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-48 rounded-[16px]" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-72 rounded-[16px]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-14 w-56 rounded-[16px]" />
        </div>
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-[52px] flex-1 rounded-[14px]" />
          <Skeleton className="h-[52px] w-24 rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}

export function RequestsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, column) => (
        <section key={column}>
          <div className="mb-4 space-y-2">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-7 w-36 rounded-full" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 2 }).map((__, index) => (
              <SkeletonBlock key={index}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12 rounded-full" />
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-3 w-32 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-[12px]" />
                </div>
                <div className="mt-4">
                  <SkeletonText lines={2} />
                </div>
                <div className="mt-5 flex gap-3">
                  <Skeleton className="h-11 w-24 rounded-[14px]" />
                  <Skeleton className="h-11 w-24 rounded-[14px]" />
                </div>
              </SkeletonBlock>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="p-6">
        <Skeleton className="h-3 w-28 rounded-full" />
        <div className="mt-4">
          <Skeleton className="h-6 w-56 rounded-full" />
        </div>
        <div className="mt-4">
          <SkeletonText lines={3} />
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-11 w-32 rounded-[14px]" />
          <Skeleton className="h-11 w-28 rounded-[14px]" />
        </div>
      </SkeletonBlock>
      <ContentCardsSkeleton count={2} />
    </div>
  );
}
