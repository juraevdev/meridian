import { AnimatePresence, motion } from 'framer-motion'
import type {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { X } from 'lucide-react'

export function Modal({
  open,
  title,
  index,
  onClose,
  children,
}: {
  open: boolean
  title: string
  index?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[80] bg-void/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[8vh]">
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto max-h-[84vh] w-full max-w-xl overflow-auto border border-line bg-void scroll-thin"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-void px-5 py-4">
              <div>
                {index ? (
                  <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-mute">{index}</p>
                ) : null}
                <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center border border-line text-mute transition hover:border-bone hover:text-bone"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-mute">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full border border-line bg-surface px-3 py-2.5 text-sm text-bone outline-none transition placeholder:text-dim focus:border-bone/40'

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 resize-y ${props.className ?? ''}`} />
}

export function FormActions({
  onCancel,
  submitLabel = 'Save',
}: {
  onCancel: () => void
  submitLabel?: string
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-mute transition hover:text-bone"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="rounded-full border border-bone bg-bone px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-void transition hover:bg-cream"
      >
        {submitLabel}
      </button>
    </div>
  )
}

export function FormGrid({ children, onSubmit }: { children: ReactNode; onSubmit: (e: FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {children}
    </form>
  )
}
