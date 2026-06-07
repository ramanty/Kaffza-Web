import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import DashboardShell from './shell';
import { StoreProvider } from './store-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="flex h-screen overflow-hidden w-full bg-[#05050f] text-white relative selection:bg-blue-500/30">
      {/* Nebula Dark Tech Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-center bg-cover bg-no-repeat mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#1a1a2e_0%,transparent_80%)]" />

      <div className="relative z-10 flex h-screen overflow-hidden w-full">
        <Toaster position='top-center' richColors closeButton dir='rtl' />
        <StoreProvider>
          <DashboardShell>{children}</DashboardShell>
        </StoreProvider>
      </div>
    </div>
  );
}
