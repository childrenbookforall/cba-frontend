import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  fallback: string
  className?: string
}

export default function BackButton({
  fallback,
  className = 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition',
}: BackButtonProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback)}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 ${className}`}
      aria-label="Go back"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  )
}
