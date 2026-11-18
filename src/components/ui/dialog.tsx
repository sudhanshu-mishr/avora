'use client';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
export function Dialog({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}
      role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg surface p-5 shadow-lift" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="mb-4 font-medium text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}