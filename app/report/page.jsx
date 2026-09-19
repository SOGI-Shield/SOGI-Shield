import dynamic from 'next/dynamic';

const ReportClient = dynamic(() => import('./ReportClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="animate-pulse bg-slate-800 rounded-xl w-full max-w-4xl h-[600px]"></div>
    </div>
  )
});

export default function ReportPage() {
  return <ReportClient />;
}
