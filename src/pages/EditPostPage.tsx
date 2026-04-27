import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPost, updatePost } from '../api/posts'
import { getApiError } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import MentionTextarea from '../components/ui/MentionTextarea'
import { useAuthStore } from '../stores/authStore'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Max 200 characters'),
  content: z.string().refine(
    (v) => v.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').length <= 10000,
    'Max 10,000 characters'
  ).optional(),
  linkUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type Fields = z.infer<typeof schema>

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: !!postId,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (post) {
      reset({ title: post.title, content: post.content ?? '', linkUrl: post.linkUrl ?? '' })
    }
  }, [post, reset])

  // Guard: only owner can edit
  useEffect(() => {
    if (post && currentUser && post.userId !== currentUser.id) {
      navigate(`/posts/${postId}`, { replace: true })
    }
  }, [post, currentUser, navigate, postId])

  async function onSubmit(data: Fields) {
    if (!postId) return
    try {
      await updatePost(postId, { title: data.title, content: data.content, linkUrl: data.linkUrl || undefined })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      navigate(`/posts/${postId}`)
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface">
      <title>Edit Post - CBA</title>
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition" aria-label="Go back">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Edit Post</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-4 max-w-lg mx-auto">
        <div className="mb-3">
          <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
            Title
          </label>
          <input
            {...register('title')}
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              errors.title ? 'border-danger bg-red-50' : 'border-border'
            }`}
          />
          {errors.title && <p className="text-[0.625rem] text-danger mt-1">{errors.title.message}</p>}
        </div>

        {post?.type === 'text' && (
          <div className="mb-4">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
              Content
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <MentionTextarea
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  groupId={post.groupId}
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              )}
            />
          </div>
        )}

        {post?.type === 'photo' && (
          <div className="mb-4">
            <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
              Caption
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <MentionTextarea
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  groupId={post.groupId}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              )}
            />
          </div>
        )}

        {post?.type === 'link' && (
          <>
            <div className="mb-3">
              <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
                URL
              </label>
              <input
                {...register('linkUrl')}
                type="url"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  errors.linkUrl ? 'border-danger bg-red-50' : 'border-border'
                }`}
              />
              {errors.linkUrl && <p className="text-[0.625rem] text-danger mt-1">{errors.linkUrl.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
                Description
              </label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <MentionTextarea
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    groupId={post.groupId}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                )}
              />
            </div>
          </>
        )}

        {errors.root && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl">
            <p className="text-xs text-danger">{errors.root.message}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-sm font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-accent text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting && <Spinner size="sm" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
