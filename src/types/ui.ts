import type { ReactNode, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from 'react'

// ── Card ─────────────────────────────────────────────
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean
  children: ReactNode
}

export interface CardSectionProps {
  children: ReactNode
  className?: string
}

// ── Button ───────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

// ── Input ────────────────────────────────────────────
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// ── Select ───────────────────────────────────────────
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

// ── Modal ────────────────────────────────────────────
export interface ModalProps {
  open: boolean
  onClose?: () => void
  title?: string
  children: ReactNode
  className?: string
}

// ── Table ────────────────────────────────────────────
export interface TableProps {
  children: ReactNode
  className?: string
}

export interface ThProps {
  children?: ReactNode
  className?: string
  sortable?: boolean
  active?: boolean
  desc?: boolean
  onClick?: () => void
}

export interface TdProps {
  children?: ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

export interface TrProps {
  children: ReactNode
  className?: string
}

// ── Badge ────────────────────────────────────────────
export type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'neutral'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

// ── EmptyState ───────────────────────────────────────
export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

// ── Spinner ──────────────────────────────────────────
export interface SpinnerProps {
  size?: number
  className?: string
}

// ── PageHeader ───────────────────────────────────────
export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}