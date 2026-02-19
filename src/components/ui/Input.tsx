import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {label && (
                    <label className="text-sm font-medium" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={clsx(
                        'input',
                        className
                    )}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '1rem',
                        width: '100%'
                    }}
                    {...props}
                />
                {error && (
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
