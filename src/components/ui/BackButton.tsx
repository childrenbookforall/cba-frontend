import { useNavigate } from 'react-router-dom'

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
      className={className}
      aria-label="Go back"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}
