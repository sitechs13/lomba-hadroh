import React from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white mt-0.5 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-indigo-300">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{toast.body}</p>
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                {new Date(toast.timestamp).toLocaleTimeString('id-ID')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
