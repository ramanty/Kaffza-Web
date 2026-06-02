import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import DashboardShell from './shell';
import { StoreProvider } from './store-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="flex h-screen overflow-hidden w-full">
      <Toaster position='top-center' richColors closeButton dir='rtl' />
      <StoreProvider>
        <DashboardShell>{children}</DashboardShell>
      </StoreProvider>
    </div>
  );
}
