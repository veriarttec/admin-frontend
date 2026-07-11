'use client';

import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
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
                        <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
                            <h3 className="text-lg font-semibold text-primary">
                                {options.title}
                            </h3>
                            {options.description && (
                                <p className="mt-2 text-sm text-foreground">
                                    {options.description}
                                </p>
                            )}
                            {options.input && (
                                <div className="mt-4">
                                    <Label className="mb-1">
                                        {options.input.label}
                                        {options.input.required && <span className="text-destructive"> *</span>}
                                    </Label>
                                    {options.input.multiline ? (
                                        <Textarea
                                            autoFocus
                                            rows={3}
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setInputError(false);
                                            }}
                                            placeholder={options.input.placeholder}
                                            className={inputError ? 'border-destructive' : ''}
                                        />
                                    ) : (
                                        <Input
                                            autoFocus
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setInputError(false);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                            placeholder={options.input.placeholder}
                                            className={inputError ? 'border-destructive' : ''}
                                        />
                                    )}
                                    {inputError && (
                                        <p className="mt-1 text-xs text-destructive">
                                            This field is required
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="mt-6 flex justify-end gap-3">
                                <Button variant="outline" onClick={handleCancel}>
                                    {options.cancelLabel || 'Cancel'}
                                </Button>
                                <Button
                                    variant={options.destructive ? 'destructive' : 'default'}
                                    onClick={handleConfirm}
                                >
                                    {options.confirmLabel || 'Confirm'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const confirm = useContext(ConfirmContext);
    if (!confirm) throw new Error('useConfirm must be used within ConfirmDialogProvider');
    return confirm;
}
