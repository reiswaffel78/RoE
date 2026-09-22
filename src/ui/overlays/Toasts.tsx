import { useToasts } from '../toastStore';
import { Icon } from '../components/Icon';

export const Toasts = () => {
    const toasts = useToasts((s) => s.toasts);
    return (
        <div className="toasts" role="status" aria-live="polite">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast glass toast--${toast.kind} ${toast.leaving ? 'toast--out' : ''}`}>
                    <div className="toast__icon">
                        <Icon name={toast.icon} size={17} />
                    </div>
                    <div>
                        {toast.kicker && <div className="toast__kicker">{toast.kicker}</div>}
                        <div className="toast__title">{toast.title}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
