import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function PageHeader({
  index,
  title,
  description,
  action,
}: {
  index?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10 flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="max-w-3xl">
        {index ? (
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.28em] text-mute">
            {index}
          </p>
        ) : null}
        <h1 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-bone">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute">{description}</p>
        ) : null}
      </div>
      {action}
    </motion.div>
  )
}

export function Metric({
  index,
  label,
  value,
  delay = 0,
}: {
  index: string
  label: string
  value: string | number
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border border-line bg-surface/80 px-5 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-mute">{label}</p>
        <span className="text-[10px] tracking-[0.2em] text-dim">{index}</span>
      </div>
      <p className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-bone">
        {value}
      </p>
    </motion.div>
  )
}

export function SectionLabel({
  children,
  index,
}: {
  children: ReactNode
  index?: string
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-bone">
        {children}
      </h2>
      {index ? (
        <span className="text-[10px] uppercase tracking-[0.24em] text-mute">{index}</span>
      ) : null}
    </div>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong px-6 py-10 text-center text-sm text-mute">
      {children}
    </div>
  )
}

export function GhostButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border border-bone/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-bone transition hover:border-bone hover:bg-bone hover:text-void disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-bone/30 disabled:hover:bg-transparent disabled:hover:text-bone ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
