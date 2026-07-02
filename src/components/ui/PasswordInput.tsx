import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean
}

export default function PasswordInput({ hasError, className, ...props }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition ${
          hasError ? 'border-danger bg-red-50' : 'border-border'
        } ${className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary transition"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
