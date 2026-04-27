import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const show = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.top, left: r.left + r.width / 2 });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={e => { e.stopPropagation(); pos ? hide() : show(); }}
        className="ml-0.5 inline-flex items-center text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 focus:outline-none transition-colors"
        aria-label="Help"
      >
        <HelpCircle size={12} />
      </button>
      {pos && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top - 8, left: pos.left, transform: 'translate(-50%, -100%)', zIndex: 9999 }}
          className="w-64 rounded-lg bg-zinc-900 dark:bg-zinc-700 text-white text-xs px-3 py-2 shadow-xl leading-relaxed pointer-events-none"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-900 dark:border-t-zinc-700" />
        </div>,
        document.body
      )}
    </>
  );
}
