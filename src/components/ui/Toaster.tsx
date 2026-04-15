import { useToastStore } from '../../stores/toastStore'

export default function Toaster() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="animate-toast-in pointer-events-auto bg-gray-800 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold text-white max-w-sm w-full flex items-center gap-2.5 cursor-pointer"
        >
          {t.type === 'error' ? (
            <span className="text-danger flex-shrink-0">✕</span>
          ) : (
            <span className="text-green-400 flex-shrink-0">✓</span>
          )}
          {t.message}
        </div>
      ))}
    </div>
  )
}
