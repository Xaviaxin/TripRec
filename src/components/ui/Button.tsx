import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css'; // We'll assume global CSS for now based on previous file, but module is better for potential specific styles. actually I defined .btn in globals.

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(
                    'btn',
                    `btn-${variant}`,
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
