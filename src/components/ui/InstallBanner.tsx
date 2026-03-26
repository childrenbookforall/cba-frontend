import { useInstallPromptStore } from '../../stores/installPromptStore'

export default function InstallBanner() {
  const { deferredPrompt, triggered, dismiss, install } = useInstallPromptStore()

  // Only show on browsers that support the install prompt and user has engaged
  if (!deferredPrompt || !triggered) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug">Add CBA to your home screen</p>
          <p className="text-[0.625rem] text-gray-400 mt-0.5">Quick access, works offline</p>
        </div>
        <button
          onClick={install}
          className="text-xs font-bold bg-white text-gray-900 px-3 py-1.5 rounded-xl flex-shrink-0 hover:bg-gray-100 transition"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-gray-400 hover:text-gray-200 transition flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  )
}
