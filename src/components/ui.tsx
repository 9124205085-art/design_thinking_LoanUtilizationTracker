import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.tsx'
import type { ExpenseStatus } from '../types.ts'
import { IconBack } from './Icons.tsx'

export const inputClass =
  'h-12 w-full rounded-2xl border border-line bg-white px-3 text-[17px] text-ink outline-none placeholder:text-muted'

const buttonStyles = {
  primary: 'bg-brand text-white',
  secondary: 'bg-white text-ink ring-1 ring-line',
  ghost: 'bg-transparent text-brand',
  danger: 'bg-bad text-white',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-center text-[17px] font-semibold transition-colors duration-200 active:scale-[0.99] disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[16px] font-semibold">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1.5 block text-[16px] leading-snug text-muted">{hint}</span> : null}
      {error ? (
        <span className="mt-1.5 block text-[16px] text-bad" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function Choice({
  selected,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-12 rounded-2xl px-3 text-[17px] font-semibold transition-colors duration-200 ${selected ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-line'} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(20,52,58,0.05)] ring-1 ring-[#14343a]/5 ${className}`}>{children}</section>
}

export function TopBar({ title, to }: { title: string; to?: string }) {
  const { t } = useApp()
  return (
    <header className="mb-4 flex items-center gap-2">
      {to ? (
        <Link to={to} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line" aria-label={t('back')}>
          <IconBack />
        </Link>
      ) : null}
      <h1 className="text-[1.7rem] leading-tight font-semibold">{title}</h1>
    </header>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center">
      <p className="text-[1.15rem] font-semibold">{title}</p>
      <p className="mt-2 text-[17px] leading-snug text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}

export function StatusPill({ status }: { status: ExpenseStatus }) {
  const { t } = useApp()
  const styles =
    status === 'verified'
      ? 'bg-good-bg text-good'
      : status === 'flagged'
        ? 'bg-bad-bg text-bad'
        : 'bg-warn-bg text-warn'
  const label = status === 'verified' ? t('verified') : status === 'flagged' ? t('flagged') : t('missingProof')
  return <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-[16px] font-semibold ${styles}`}>{label}</span>
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useRef(onClose)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14343a]/45 sm:items-center sm:p-4" onClick={() => closeRef.current()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="max-h-[85dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl outline-none sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className="text-[1.35rem] leading-tight font-semibold">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

export function PhoneShell({
  children,
  footer,
  fab,
}: {
  children: ReactNode
  footer?: ReactNode
  fab?: ReactNode
}) {
  const { flash } = useApp()
  return (
    <div className="min-h-dvh bg-[#d5e3e4] sm:grid sm:place-items-center sm:py-4">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-mist sm:h-[min(920px,calc(100dvh-2rem))] sm:rounded-[2rem] sm:shadow-[0_24px_70px_rgba(20,52,58,0.18)] sm:ring-1 sm:ring-[#14343a]/10">
        {flash ? (
          <div className="pointer-events-none absolute inset-x-4 top-3 z-40" role="status">
            <p className="rounded-2xl bg-ink px-4 py-3 text-[16px] leading-snug text-white shadow-lg">{flash}</p>
          </div>
        ) : null}
        <div className={`flex-1 overflow-y-auto px-4 pt-5 ${fab ? 'pb-28' : 'pb-8'}`}>{children}</div>
        {fab}
        {footer}
      </div>
    </div>
  )
}
