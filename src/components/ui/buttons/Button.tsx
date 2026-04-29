'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/* ============================================================================
   Button Component
   All variants defined in styles-new.md.
   Uses .btn, .btn-primary, .btn-secondary, etc. from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'verify' | 'icon';
type ButtonSize = 'lg' | 'default' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  verify:    'btn-verify',
  icon:      'btn-icon',
};

const sizeClassMap: Record<ButtonSize, string> = {
  lg:      'btn-lg',
  default: '',
  sm:      'btn-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      'btn',
      variantClassMap[variant],
      sizeClassMap[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        style={fullWidth ? { width: '100%' } : undefined}
        {...props}
      >
        {loading ? (
          <Loader2
            size={16}
            style={{
              animation: 'spin 1s linear infinite',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
        ) : (
          iconLeft && (
            <span className="btn__icon-left" aria-hidden="true" style={{ flexShrink: 0, display: 'flex' }}>
              {iconLeft}
            </span>
          )
        )}

        {variant !== 'icon' && children && (
          <span>{children}</span>
        )}

        {variant === 'icon' && !loading && (
          <span aria-hidden={typeof children === 'string'} style={{ display: 'flex' }}>
            {children}
          </span>
        )}

        {!loading && iconRight && (
          <span className="btn__icon-right" aria-hidden="true" style={{ flexShrink: 0, display: 'flex' }}>
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* ──────────────────────────────────────────────────────────────────────────── */
/* Convenience exports — named variants for ergonomic import                   */

export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="secondary" {...props} />
);

export const GhostButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="ghost" {...props} />
);

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="danger" {...props} />
);

export const VerifyButton = (props: Omit<ButtonProps, 'variant'>) => (
  <Button variant="verify" {...props} />
);

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'iconLeft' | 'iconRight'> & { 'aria-label': string }
>((props, ref) => <Button ref={ref} variant="icon" {...props} />);

IconButton.displayName = 'IconButton';

export default Button;
