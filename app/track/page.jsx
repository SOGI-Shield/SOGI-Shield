"use client";

import dynamic from 'next/dynamic';

const TrackClient = dynamic(() => import('./TrackClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="animate-pulse bg-slate-800 rounded-xl w-full max-w-3xl h-[400px]"></div>
    </div>
  )
});

export default function TrackPage() {
  return <TrackClient />;
}
