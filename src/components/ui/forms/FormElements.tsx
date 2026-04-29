'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  File,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

/* ============================================================================
   Form Element Components
   All variants defined in styles-new.md.
   Uses .input, .textarea, .select, .upload-zone, etc. from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

/* ────────────────────────────────────────────────────────────────────────────
   InputLabel
   ──────────────────────────────────────────────────────────────────────────── */

interface InputLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const InputLabel: React.FC<InputLabelProps> = ({
  htmlFor,
  children,
  required = false,
  className = '',
}) => (
  <label
    htmlFor={htmlFor}
    className={`input-label${required ? ' input-label--required' : ''}${className ? ` ${className}` : ''}`}
  >
    {children}
  </label>
);

/* ────────────────────────────────────────────────────────────────────────────
   FormGroup
   ──────────────────────────────────────────────────────────────────────────── */

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => (
  <div className={`form-group${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   ErrorMessage
   ──────────────────────────────────────────────────────────────────────────── */

interface ErrorMessageProps {
  id?: string;
  children: React.ReactNode;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ id, children }) => (
  <p
    id={id}
    className="input-error"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle size={12} aria-hidden="true" strokeWidth={2.5} />
    {children}
  </p>
);

/* ────────────────────────────────────────────────────────────────────────────
   HintText
   ──────────────────────────────────────────────────────────────────────────── */

interface HintTextProps {
  id?: string;
  children: React.ReactNode;
}

export const HintText: React.FC<HintTextProps> = ({ id, children }) => (
  <p id={id} className="input-hint">
    {children}
  </p>
);

/* ────────────────────────────────────────────────────────────────────────────
   Input
   ──────────────────────────────────────────────────────────────────────────── */

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  hasError?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      hint,
      required = false,
      hasError,
      wrapperClassName = '',
      inputClassName = '',
      showPasswordToggle = false,
      type = 'text',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const isError = hasError || Boolean(error);

    const describedBy = [
      ariaDescribedBy,
      errorId,
      hintId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    const resolvedType =
      type === 'password' && showPassword ? 'text' : type;

    return (
      <FormGroup className={wrapperClassName}>
        {label && (
          <InputLabel htmlFor={inputId} required={required}>
            {label}
          </InputLabel>
        )}

        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={`input${isError ? ' input--error' : ''}${inputClassName ? ` ${inputClassName}` : ''}`}
            required={required}
            aria-required={required}
            aria-invalid={isError}
            aria-describedby={describedBy}
            style={
              showPasswordToggle && type === 'password'
                ? { paddingRight: 'var(--space-12)' }
                : undefined
            }
            {...props}
          />

          {/* Password visibility toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                transition: 'color var(--duration-fast) var(--ease-out)',
              }}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
        {!error && hint && <HintText id={hintId}>{hint}</HintText>}
      </FormGroup>
    );
  }
);

Input.displayName = 'Input';

/* ────────────────────────────────────────────────────────────────────────────
   Textarea
   ──────────────────────────────────────────────────────────────────────────── */

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  hasError?: boolean;
  wrapperClassName?: string;
  textareaClassName?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      error,
      hint,
      required = false,
      hasError,
      wrapperClassName = '',
      textareaClassName = '',
      showCharCount = false,
      maxLength,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const isError = hasError || Boolean(error);
    const charCount = typeof value === 'string' ? value.length : 0;

    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <FormGroup className={wrapperClassName}>
        {label && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <InputLabel htmlFor={textareaId} required={required}>
              {label}
            </InputLabel>
            {showCharCount && maxLength && (
              <span
                style={{
                  fontSize: 'var(--text-caption-size)',
                  color: charCount > maxLength * 0.9 ? 'var(--status-warning-text)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1px',
                }}
                aria-live="polite"
                aria-label={`${charCount} of ${maxLength} characters`}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`textarea${isError ? ' textarea--error' : ''}${textareaClassName ? ` ${textareaClassName}` : ''}`}
          required={required}
          aria-required={required}
          aria-invalid={isError}
          aria-describedby={describedBy}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          {...props}
        />

        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
        {!error && hint && <HintText id={hintId}>{hint}</HintText>}
      </FormGroup>
    );
  }
);

Textarea.displayName = 'Textarea';

/* ────────────────────────────────────────────────────────────────────────────
   Select
   ──────────────────────────────────────────────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  hasError?: boolean;
  placeholder?: string;
  options: SelectOption[];
  wrapperClassName?: string;
  selectClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      error,
      hint,
      required = false,
      hasError,
      placeholder,
      options,
      wrapperClassName = '',
      selectClassName = '',
      ...props
    },
    ref
  ) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const isError = hasError || Boolean(error);
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <FormGroup className={wrapperClassName}>
        {label && (
          <InputLabel htmlFor={selectId} required={required}>
            {label}
          </InputLabel>
        )}

        <select
          ref={ref}
          id={selectId}
          className={`select${isError ? ' input--error' : ''}${selectClassName ? ` ${selectClassName}` : ''}`}
          required={required}
          aria-required={required}
          aria-invalid={isError}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
        {!error && hint && <HintText id={hintId}>{hint}</HintText>}
      </FormGroup>
    );
  }
);

Select.displayName = 'Select';

/* ────────────────────────────────────────────────────────────────────────────
   UploadZone
   States: default → drag-over → uploading → complete → error
   ──────────────────────────────────────────────────────────────────────────── */

export type UploadState = 'default' | 'drag-over' | 'uploading' | 'complete' | 'error';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface UploadZoneProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  state?: UploadState;
  uploadedFile?: UploadedFile | null;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  errorMessage?: string;
  hint?: string;
  className?: string;
  /** For controlled/demo mode — lock the state */
  forceState?: UploadState;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 5,
  required = false,
  state: controlledState,
  uploadedFile,
  onFileSelect,
  onRemove,
  errorMessage,
  hint,
  className = '',
  forceState,
}) => {
  const [internalState, setInternalState] = useState<UploadState>('default');
  const [internalFile, setInternalFile] = useState<UploadedFile | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeState = forceState ?? controlledState ?? internalState;
  const activeFile = uploadedFile ?? internalFile;
  const activeError = errorMessage ?? internalError ?? null;

  const acceptedTypes = accept
    .split(',')
    .map((t) => t.trim().replace('.', '').toUpperCase())
    .join(' · ');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!forceState && activeState !== 'uploading' && activeState !== 'complete') {
      setInternalState('drag-over');
    }
  }, [forceState, activeState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!forceState && internalState === 'drag-over') {
      setInternalState('default');
    }
  }, [forceState, internalState]);

  const processFile = useCallback(
    (file: File) => {
      if (forceState) return;

      setInternalError(null);
      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > maxSizeMB) {
        setInternalState('error');
        setInternalError(`File exceeds the ${maxSizeMB}MB limit. Please choose a smaller file.`);
        return;
      }

      setInternalState('uploading');
      setInternalFile({ name: file.name, size: file.size, type: file.type });

      // Simulate upload — consumers replace this with onFileSelect
      setTimeout(() => {
        setInternalState('complete');
        onFileSelect?.(file);
      }, 1800);
    },
    [forceState, maxSizeMB, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRemove = useCallback(() => {
    if (forceState) return;
    setInternalState('default');
    setInternalFile(null);
    setInternalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  }, [forceState, onRemove]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    []
  );

  const stateClass =
    activeState === 'drag-over' ? ' upload-zone--drag-over'
    : activeState === 'uploading' ? ' upload-zone--uploading'
    : activeState === 'complete' ? ' upload-zone--complete'
    : activeState === 'error' ? ' upload-zone--error'
    : '';

  const isInteractive = activeState !== 'uploading' && activeState !== 'complete';

  return (
    <div>
      {label && (
        <InputLabel
          htmlFor={`upload-${label.replace(/\s/g, '-').toLowerCase()}`}
          required={required}
        >
          {label}
        </InputLabel>
      )}

      <div
        className={`upload-zone${stateClass}${className ? ` ${className}` : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isInteractive && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? 0 : undefined}
        role="button"
        aria-label={
          activeState === 'complete'
            ? `File uploaded: ${activeFile?.name}`
            : `Upload zone. Click or drag and drop a file. Accepted types: ${acceptedTypes}`
        }
        aria-disabled={!isInteractive}
      >
        <input
          ref={inputRef}
          id={label ? `upload-${label.replace(/\s/g, '-').toLowerCase()}` : undefined}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Icon */}
        <div className="upload-zone__icon" aria-hidden="true">
          {activeState === 'uploading' && (
            <Loader2
              size={48}
              strokeWidth={1.5}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
          {activeState === 'complete' && <CheckCircle size={48} strokeWidth={1.5} />}
          {activeState === 'error' && <AlertCircle size={48} strokeWidth={1.5} />}
          {(activeState === 'default' || activeState === 'drag-over') && (
            <Upload size={48} strokeWidth={1.5} />
          )}
        </div>

        {/* Primary text */}
        <p className="upload-zone__primary-text">
          {activeState === 'uploading' && 'Uploading…'}
          {activeState === 'complete' && 'Upload complete'}
          {activeState === 'error' && 'Upload failed'}
          {activeState === 'drag-over' && 'Drop to upload'}
          {activeState === 'default' && (
            <>
              <span>Click to upload</span> or drag and drop
            </>
          )}
        </p>

        {/* Secondary text */}
        {activeState === 'default' && (
          <p className="upload-zone__secondary-text">
            Maximum file size {maxSizeMB}MB
          </p>
        )}
        {activeState === 'complete' && activeFile && (
          <p className="upload-zone__secondary-text">{activeFile.name}</p>
        )}
        {activeState === 'uploading' && activeFile && (
          <p className="upload-zone__secondary-text">
            {activeFile.name} — please wait
          </p>
        )}

        {/* File type pill */}
        {(activeState === 'default' || activeState === 'drag-over') && (
          <span className="upload-zone__file-types">{acceptedTypes}</span>
        )}
      </div>

      {/* Uploaded file strip (shown outside zone when complete) */}
      {activeState === 'complete' && activeFile && (
        <div className="uploaded-file">
          <File
            size={18}
            className="uploaded-file__icon"
            aria-hidden="true"
          />
          <span className="uploaded-file__name">{activeFile.name}</span>
          <span className="uploaded-file__size">{formatBytes(activeFile.size)}</span>
          <button
            className="uploaded-file__remove"
            onClick={handleRemove}
            type="button"
            aria-label={`Remove ${activeFile.name}`}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Error message */}
      {activeState === 'error' && activeError && (
        <ErrorMessage>{activeError}</ErrorMessage>
      )}

      {/* Hint */}
      {hint && activeState === 'default' && (
        <HintText>{hint}</HintText>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Default export
   ──────────────────────────────────────────────────────────────────────────── */

export default Input;
