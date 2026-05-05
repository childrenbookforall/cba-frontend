import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminSiteNotification, upsertSiteNotification, toggleSiteNotification } from '../../api/admin'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import Spinner from '../../components/ui/Spinner'

export default function AdminNotificationPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: notification, isLoading } = useQuery({
    queryKey: ['admin-site-notification'],
    queryFn: getAdminSiteNotification,
  })

  const [message, setMessage] = useState('')
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (notification) {
      setMessage(notification.message)
      setLinkText(notification.linkText ?? '')
      setLinkUrl(notification.linkUrl ?? '')
    }
  }, [notification])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertSiteNotification({
        message,
        linkText: linkText || undefined,
        linkUrl: linkUrl || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-site-notification'] })
      queryClient.invalidateQueries({ queryKey: ['site-notification'] })
      toast('Notification saved', 'success')
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    try {
      await toggleSiteNotification()
      queryClient.invalidateQueries({ queryKey: ['admin-site-notification'] })
      queryClient.invalidateQueries({ queryKey: ['site-notification'] })
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setToggling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  const isActive = notification?.isActive ?? false

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notification Bar</h1>
          <p className="text-xs text-muted mt-0.5">Shown at the top of the app for all users</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling || !notification}
          title={!notification ? 'Save a notification first' : undefined}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
            isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Live preview */}
      {message && (
        <div className="mb-6 rounded-lg overflow-hidden border border-border">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-muted px-3 pt-2 pb-1">Preview</p>
          <div className="bg-accent text-white px-4 py-2 flex items-center justify-center gap-3 text-xs font-medium">
            <span className="flex-1 text-center leading-snug">
              {message}
              {linkUrl && (
                <>
                  {' '}
                  <span className="underline underline-offset-2 opacity-80">
                    {linkText || linkUrl}
                  </span>
                </>
              )}
            </span>
            <span className="opacity-75">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={2}
            placeholder="e.g. We're hosting a community meetup next weekend!"
            className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Link URL <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Link Text <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Learn more"
              className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2 text-gray-900 dark:text-gray-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !message.trim()}
          className="w-full py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
