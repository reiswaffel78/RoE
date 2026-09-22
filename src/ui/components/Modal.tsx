import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

interface ModalProps {
    title: string;
    onClose?: () => void;
    children: ReactNode;
    className?: string;
}

/** Accessible dialog: focus moves in, Escape closes, focus returns on close. */
export const Modal = ({ title, onClose, children, className = '' }: ModalProps) => {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const node = ref.current;
        const focusable = node?.querySelector<HTMLElement>('button, [href], input, textarea, select');
        focusable?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                e.stopPropagation();
                onClose();
            }
            if (e.key === 'Tab' && node) {
                const items = Array.from(node.querySelectorAll<HTMLElement>('button, [href], input, textarea, select')).filter(
                    (el) => !el.hasAttribute('disabled'),
                );
                if (items.length === 0) return;
                const first = items[0];
                const last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            previous?.focus?.();
        };
    }, [onClose]);

    return createPortal(
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
            <div ref={ref} className={`modal glass ${className}`} role="dialog" aria-modal="true" aria-label={title}>
                <div className="modal__head">
                    <h2 className="modal__title">{title}</h2>
                    {onClose && (
                        <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
                            <Icon name="close" />
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>,
        document.body,
    );
};
