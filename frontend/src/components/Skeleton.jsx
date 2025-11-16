import React from 'react';

export const Skeleton = ({ className = '', width, height, rounded = 'rounded' }) => {
  return (
    <div
      className={`bg-[#0f0f0f] animate-pulse ${rounded} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem'
      }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-6 space-y-4">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="80%" />
      <div className="flex gap-4 mt-4">
        <Skeleton height="3rem" width="30%" rounded="rounded-lg" />
        <Skeleton height="3rem" width="30%" rounded="rounded-lg" />
        <Skeleton height="3rem" width="30%" rounded="rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton height="2.5rem" width="20%" rounded="rounded-lg" />
          <Skeleton height="2.5rem" width="30%" rounded="rounded-lg" />
          <Skeleton height="2.5rem" width="25%" rounded="rounded-lg" />
          <Skeleton height="2.5rem" width="25%" rounded="rounded-lg" />
        </div>
      ))}
    </div>
  );
};

