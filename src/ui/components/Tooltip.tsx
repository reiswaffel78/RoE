import { cloneElement, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: ReactNode;
    children: ReactElement<Record<string, unknown>>;
    placement?: 'top' | 'bottom' | 'left';
}

/** Hover / focus tooltip rendered in a portal, clamped to the viewport. */
export const Tooltip = ({ content, children, placement = 'top' }: TooltipProps) => {
    const [anchor, setAnchor] = useState<DOMRect | null>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

    useLayoutEffect(() => {
        if (!anchor || !tipRef.current) return;
        const tip = tipRef.current.getBoundingClientRect();
        let x = anchor.left + anchor.width / 2 - tip.width / 2;
        let y = placement === 'bottom' ? anchor.bottom + 10 : anchor.top - tip.height - 10;
        if (placement === 'left') {
            x = anchor.left - tip.width - 12;
            y = anchor.top + anchor.height / 2 - tip.height / 2;
        }
        if (y < 8) y = anchor.bottom + 10;
        x = Math.max(8, Math.min(window.innerWidth - tip.width - 8, x));
        y = Math.max(8, Math.min(window.innerHeight - tip.height - 8, y));
        setPos({ x, y });
    }, [anchor, placement]);

    const show = (e: { currentTarget: EventTarget }) => setAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    const hide = () => {
        setAnchor(null);
        setPos(null);
    };

    return (
        <>
            {cloneElement(children, {
                onMouseEnter: show,
                onMouseLeave: hide,
                onFocus: show,
                onBlur: hide,
            })}
            {anchor &&
                createPortal(
                    <div
                        ref={tipRef}
                        className="tooltip"
                        role="tooltip"
                        style={{ left: pos?.x ?? -9999, top: pos?.y ?? -9999 }}
                    >
                        {content}
                    </div>,
                    document.body,
                )}
        </>
    );
};
