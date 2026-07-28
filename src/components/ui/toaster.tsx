import React from 'react';
import { useToast } from './use-toast';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ToasterProps {
  onFocusItem?: (itemId: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ onFocusItem }) => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  // Max 3 stack
  const visibleToasts = toasts.slice(0, 3);

  return (
    <div
      id="toast-notification-container"
      className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none"
    >
      {visibleToasts.map((item) => {
        const isLowStock = item.type === 'low_stock';
        const isSuccess = item.type === 'success';
        const isWarning = item.type === 'warning';
        const duration = item.duration || 1000;

        // Outer glow color & border styling
        const glowColor = isLowStock
          ? 'rgba(244, 63, 94, 0.85)'
          : isSuccess
          ? 'rgba(16, 185, 129, 0.85)'
          : isWarning
          ? 'rgba(245, 158, 11, 0.85)'
          : 'rgba(59, 130, 246, 0.85)';

        const borderColor = isLowStock
          ? 'border-rose-500/80 ring-2 ring-rose-500/40'
          : isSuccess
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/40'
          : isWarning
          ? 'border-amber-500/80 ring-2 ring-amber-500/40'
          : 'border-blue-500/80 ring-2 ring-blue-500/40';

        const barGlowClass = isLowStock
          ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
          : isSuccess
          ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
          : isWarning
          ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
          : 'bg-blue-400 shadow-[0_0_10px_#60a5fa]';

        return (
          <div
            key={item.id}
            style={
              {
                '--toast-duration': `${duration}ms`,
                '--glow-color': glowColor,
              } as React.CSSProperties
            }
            className={`relative overflow-hidden pointer-events-auto flex flex-col rounded-2xl p-4 transition-all transform animate-toast-outer-glow ${
              isLowStock
                ? 'bg-zinc-950 text-white'
                : isSuccess
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-950 text-white'
            } ${borderColor}`}
          >
            {/* Outer Glow Timeout Shrinking Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800/60 overflow-hidden rounded-t-2xl">
              <div
                className={`h-full animate-toast-progress ${barGlowClass}`}
              />
            </div>

            <div className="flex items-start justify-between space-x-2 pt-0.5">
              <div className="flex items-center space-x-2.5">
                {isLowStock ? (
                  <div className="p-1.5 rounded-lg bg-rose-500 text-white animate-pulse shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : isSuccess ? (
                  <div className="p-1.5 rounded-lg bg-emerald-500 text-white shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-black tracking-wide uppercase">
                    {item.title}
                  </h4>
                  <p className="text-xs font-medium text-zinc-300 leading-snug mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => dismissToast(item.id)}
                className="text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item Details Card for Low Stock alerts */}
            {item.itemDetails && (
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-400">Current Stock: </span>
                  <span className="font-bold text-rose-400">
                    {item.itemDetails.currentStock} {item.itemDetails.uom}
                  </span>
                  <span className="text-zinc-500 text-[10px] ml-1">
                    (Reorder @ {item.itemDetails.reorderThreshold})
                  </span>
                </div>

                {onFocusItem && (
                  <button
                    onClick={() => {
                      onFocusItem(item.itemDetails!.itemId);
                      dismissToast(item.id);
                    }}
                    className="text-[10px] font-sans font-bold bg-white text-black px-2 py-1 rounded-md hover:bg-zinc-200 transition-colors"
                  >
                    View Item →
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
