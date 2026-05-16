'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { authHeader } from '../lib/auth';
import { useStore } from '../app/dashboard/store-context';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({ isEn = false }: { isEn?: boolean }) {
  const { storeId } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.get(`/stores/${storeId}/notifications?limit=10`, {
        headers: { ...authHeader(), 'x-client': 'web' },
      });
      const list = res?.data?.data || [];
      setNotifications(
        list.map((n: any) => ({
          id: String(n.id),
          type: n.type || 'info',
          title: n.title || (isEn ? 'Notification' : 'إشعار'),
          message: n.message || '',
          read: Boolean(n.read),
          createdAt: n.createdAt,
        }))
      );
    } catch {
      // API might not exist yet, show empty state
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(
        `/stores/${storeId}/notifications/${id}/read`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(
        `/stores/${storeId}/notifications/read-all`,
        {},
        { headers: { ...authHeader(), 'x-client': 'web' } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [storeId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '🧾';
      case 'payment':
        return '💰';
      case 'dispute':
        return '⚠️';
      case 'shipping':
        return '🚚';
      default:
        return '🔔';
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return isEn ? 'Just now' : 'الآن';
      if (minutes < 60) return isEn ? `${minutes}m ago` : `منذ ${minutes} دقيقة`;
      if (hours < 24) return isEn ? `${hours}h ago` : `منذ ${hours} ساعة`;
      return isEn ? `${days}d ago` : `منذ ${days} يوم`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg border border-black/10 bg-white p-2 transition hover:bg-slate-50"
        aria-label={isEn ? 'Notifications' : 'الإشعارات'}
      >
        <svg
          className="h-5 w-5 text-kaffza-text"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            dir={isEn ? 'ltr' : 'rtl'}
            className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-black/10 bg-white shadow-xl sm:left-auto sm:right-0"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="text-sm font-extrabold text-kaffza-primary">
                {isEn ? 'Notifications' : 'الإشعارات'}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-kaffza-primary underline"
                >
                  {isEn ? 'Mark all read' : 'قراءة الكل'}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-kaffza-text/70">
                  {isEn ? 'Loading...' : 'جاري التحميل...'}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-3xl">🔔</div>
                  <div className="mt-2 text-sm text-kaffza-text/70">
                    {isEn ? 'No notifications yet' : 'لا توجد إشعارات'}
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full border-b border-black/5 px-4 py-3 text-right transition hover:bg-slate-50 ${
                      !n.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getTypeIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-kaffza-text truncate">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-kaffza-text/70 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="mt-1 block text-[10px] text-kaffza-text/50">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-black/10 p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  loadNotifications();
                }}
                className="w-full rounded-lg bg-kaffza-bg px-3 py-2 text-xs font-bold text-kaffza-text hover:bg-slate-100"
              >
                {isEn ? 'Refresh' : 'تحديث'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
