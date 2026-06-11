'use client';

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    ReactNode,
} from 'react';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    /** When set, the dialog shows a text input and resolves with its value (or null on cancel). */
    input?: {
        label: string;
        placeholder?: string;
        required?: boolean;
        multiline?: boolean;
    };
}

type Resolver = (value: boolean | string | null) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean | string | null>) | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState(false);
    const resolverRef = useRef<Resolver | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setInputValue('');
        setInputError(false);
        return new Promise<boolean | string | null>((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const close = (value: boolean | string | null) => {
        resolverRef.current?.(value);
        resolverRef.current = null;
        setOptions(null);
    };

    const handleConfirm = () => {
        if (options?.input) {
            const trimmed = inputValue.trim();
            if (options.input.required && !trimmed) {
                setInputError(true);
                return;
            }
            close(trimmed);
        } else {
            close(true);
        }
    };

    const handleCancel = () => close(options?.input ? null : false);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {options && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/30 transition-all"
                            onClick={handleCancel}
                        ></div>
                        <div
                            className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                            style={{ border: '1px solid var(--card-border)' }}
                        >
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--sidebar-active)' }}>
                                {options.title}
                            </h3>
                            {options.description && (
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {options.description}
                                </p>
                            )}
                            {options.input && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {options.input.label}
                                        {options.input.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                                    </label>
                                    {options.input.multiline ? (
                                        <textarea
                                            autoFocus
                                            rows={3}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setInputError(false);
                                            }}
                                            placeholder={options.input.placeholder}
                                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: inputError ? 'var(--danger)' : 'var(--border-color)' }}
                                        />
                                    ) : (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setInputError(false);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                            placeholder={options.input.placeholder}
                                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                            style={{ borderColor: inputError ? 'var(--danger)' : 'var(--border-color)' }}
                                        />
                                    )}
                                    {inputError && (
                                        <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                                            This field is required
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={handleCancel} className="btn-outline">
                                    {options.cancelLabel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={options.destructive ? 'btn-danger' : 'btn-primary'}
                                >
                                    {options.confirmLabel || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

/**
 * Promise-based confirmation dialog (replaces window.confirm / window.prompt).
 *
 * const confirm = useConfirm();
 * if (!(await confirm({ title: 'Delete bank?', destructive: true }))) return;
 *
 * const reason = await confirm({ title: 'Reject document', input: { label: 'Rejection reason', required: true } });
 * if (reason === null) return; // cancelled
 */
export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return confirm;
}
