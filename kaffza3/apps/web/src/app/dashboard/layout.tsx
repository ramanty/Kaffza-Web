import type { ReactNode } from 'react';
import DashboardShell from './shell';
import { StoreProvider } from './store-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl">
      <StoreProvider>
        <DashboardShell>{children}</DashboardShell>
      </StoreProvider>
    </div>
  );
}
