import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-3 rounded-full"
          style={{ width: index === lines - 1 ? "68%" : "100%" }}
        />
      ))}
    </div>
  );
}

type SkeletonBlockProps = {
  children?: ReactNode;
  className?: string;
};

export function SkeletonBlock({ children, className = "" }: SkeletonBlockProps) {
  return (
    <div
      className={`rounded-[22px] bg-white/[0.035] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
