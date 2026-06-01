import type { ReactNode } from 'react';
import DashboardShell from './shell';
import { StoreProvider } from './store-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="flex h-screen overflow-hidden w-full">
      <StoreProvider>
        <DashboardShell>{children}</DashboardShell>
      </StoreProvider>
    </div>
  );
}
