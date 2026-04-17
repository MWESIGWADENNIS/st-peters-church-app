import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div 
      className={cn("animate-pulse bg-gray-200 rounded-xl", className)} 
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative h-52 rounded-[2.5rem] bg-gray-100 flex flex-col justify-end p-8 space-y-3">
      <Skeleton className="h-4 w-32 bg-gray-200" />
      <Skeleton className="h-10 w-3/4 bg-gray-200" />
      <div className="flex gap-4">
        <Skeleton className="h-6 w-24 bg-gray-200" />
        <Skeleton className="h-6 w-24 bg-gray-200" />
      </div>
    </div>
  );
}
