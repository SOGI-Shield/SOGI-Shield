import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800 animate-pulse rounded-lg">
      <span className="text-slate-400 font-medium">Initializing Global Incident Map...</span>
    </div>
  ),
});

export default function Map() {
  return <MapClient />;
}
