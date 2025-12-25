
'use client';
import dynamic from 'next/dynamic';

// Dynamically import the main App component to prevent SSR issues with browser-only features
const MainApp = dynamic(() => import('../App'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen bg-[#0B0F14] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
});

export default function Page() {
  return <MainApp />;
}
