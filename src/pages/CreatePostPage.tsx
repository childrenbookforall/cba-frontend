import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useImageDropzone } from '../hooks/useImageDropzone'
import { useQueryClient } from '@tanstack/react-query'
import { createPost } from '../api/posts'
import { useGroups } from '../hooks/useGroups'
import { flattenGroups } from '../lib/groups'
import { useAuthStore } from '../stores/authStore'
import { getApiError } from '../lib/utils'
import { useToast } from '../stores/toastStore'
import Spinner from '../components/ui/Spinner'
import ContentField from '../components/ui/ContentField'
import BackButton from '../components/ui/BackButton'
import NavLinks from '../components/layout/NavLinks'

type PostType = 'text' | 'link' | 'photo'

const DRAFT_KEY = 'cba_post_draft'

interface DraftData {
  type: PostType
  groupId?: string
  title?: string
  content?: string
  linkUrl?: string
}

const baseSchema = z.object({
  groupId: z.string().min(1, 'Select a group'),
  title: z.string().min(1, 'Title is required').max(200, 'Max 200 characters'),
  content: z.string().refine(
    (v) => v.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').length <= 10000,
    'Max 10,000 characters'
  ).optional(),
  linkUrl: z.string().optional(),
})

function buildSchema(type: PostType) {
  if (type === 'link') {
    return baseSchema.extend({
      linkUrl: z.string().url('Enter a valid URL (include https://)').min(1, 'URL is required'),
    })
  }
  return baseSchema
}

type Fields = z.infer<typeof baseSchema>

export default function CreatePostPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data: groups, isLoading: groupsLoading, isError: groupsError } = useGroups()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const flatGroups = useMemo(() => flattenGroups(groups), [groups])
  // Groups the user can post in — view-only groups accept posts from admins only
  const postableGroups = useMemo(
    () => flatGroups.filter((g) => isAdmin || !g.isViewOnly),
    [flatGroups, isAdmin]
  )
  const [searchParams] = useSearchParams()
  const preselectGroupId = searchParams.get('groupId')
  const [type, setType] = useState<PostType>('text')
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([])
  const [draftBanner, setDraftBanner] = useState(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photosRef = useRef(photos)
  const typeRef = useRef(type)
  typeRef.current = type

  const resolver = useMemo(
    () => (...args: Parameters<Resolver<Fields>>) => (zodResolver(buildSchema(typeRef.current)) as unknown as Resolver<Fields>)(...args),
    []
  )

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver, mode: 'onBlur' })

  // react-hook-form's watch() can't be memoized by React Compiler — the
  // compiler skips this component either way, so the warning is just noise
  // eslint-disable-next-line react-hooks/incompatible-library
  const titleValue = watch('title') ?? ''
  const contentValue = watch('content') ?? ''
  const contentDisplayLength = contentValue.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').length
  const linkUrlValue = watch('linkUrl') ?? ''
  const groupIdValue = watch('groupId') ?? ''

  useEffect(() => {
    // Never clobber a selection already made (e.g. a restored draft's group)
    if (getValues('groupId')) return
    if (preselectGroupId && postableGroups.some((g) => g.id === preselectGroupId)) {
      setValue('groupId', preselectGroupId)
    } else if (postableGroups.length === 1) {
      setValue('groupId', postableGroups[0].id)
    }
  }, [postableGroups, preselectGroupId, setValue, getValues])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft: DraftData = JSON.parse(raw)
      if (draft.title || draft.content || draft.linkUrl) {
        setDraftBanner(true)
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      if (titleValue || contentValue || linkUrlValue) {
        const draft: DraftData = { type, groupId: groupIdValue, title: titleValue, content: contentValue, linkUrl: linkUrlValue }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      }
    }, 800)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [type, titleValue, contentValue, linkUrlValue, groupIdValue])

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft: DraftData = JSON.parse(raw)
      setType(draft.type ?? 'text')
      if (draft.title) setValue('title', draft.title)
      if (draft.content) setValue('content', draft.content)
      if (draft.linkUrl) setValue('linkUrl', draft.linkUrl)
      if (draft.groupId) setValue('groupId', draft.groupId)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
    setDraftBanner(false)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setDraftBanner(false)
  }

  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => {
    return () => { photosRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview)) }
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return
    setPhotos((prev) => {
      const slots = 10 - prev.length
      return [
        ...prev,
        ...accepted.slice(0, slots).map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ]
    })
  }, [])

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const { getRootProps, getInputProps, isDragActive } = useImageDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
    disabled: photos.length >= 10,
  })

  function handleTypeChange(newType: PostType) {
    setType(newType)
    reset({
      groupId: groupIdValue || (postableGroups.length === 1 ? postableGroups[0].id : undefined),
      title: titleValue,
      content: contentValue,
      linkUrl: newType === 'link' ? linkUrlValue : undefined,
    })
    photos.forEach(({ preview }) => URL.revokeObjectURL(preview))
    setPhotos([])
  }

  async function onSubmit(data: Fields) {
    if (type === 'photo' && photos.length === 0) {
      setError('root', { message: 'Please select at least one photo' })
      return
    }
    try {
      await createPost({
        groupId: data.groupId,
        type,
        title: data.title,
        content: data.content,
        linkUrl: data.linkUrl,
        files: photos.length > 0 ? photos.map((p) => p.file) : undefined,
      })
      localStorage.removeItem(DRAFT_KEY)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast('Post shared')
      navigate('/feed?sort=latest')
    } catch (err) {
      setError('root', { message: getApiError(err) })
    }
  }

  return (
    <div className="min-h-svh bg-surface">
      <title>New Post - CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/feed" />
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">New Post</h1>
        <NavLinks />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-4 max-w-lg mx-auto">
        {draftBanner && (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 mb-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
            <span className="text-amber-800 dark:text-amber-300 font-medium">You have an unsaved draft.</span>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={restoreDraft} className="text-primary font-semibold hover:underline">Restore</button>
              <button type="button" onClick={discardDraft} className="text-muted hover:text-primary">Discard</button>
            </div>
          </div>
        )}

        {/* Type picker */}
        <div className="flex gap-2 mb-4">
          {(['text', 'link', 'photo'] as PostType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                type === t ? 'bg-accent text-accent-text-fg' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Group select */}
        <div className="mb-3">
          <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
            Group
          </label>
          {postableGroups.length === 1 ? (
            <div className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface text-gray-900 dark:text-gray-100">
              {postableGroups[0].name}
            </div>
          ) : (
            <select
              {...register('groupId')}
              disabled={groupsLoading || groupsError || postableGroups.length === 0}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60 ${
                errors.groupId ? 'border-danger' : 'border-border'
              }`}
            >
              <option value="">
                {groupsLoading
                  ? 'Loading groups…'
                  : groupsError
                  ? 'Could not load groups'
                  : postableGroups.length === 0
                  ? flatGroups.length > 0
                    ? 'No groups available'
                    : 'You are not in any groups yet'
                  : 'Select a group…'}
              </option>
              {postableGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          {postableGroups.length === 0 && !groupsLoading && !groupsError && (
            <p className="text-[0.625rem] text-muted mt-1">
              {flatGroups.length > 0
                ? 'Only admins can post in your groups.'
                : 'An admin needs to add you to a group before you can post.'}
            </p>
          )}
          {errors.groupId && <p className="text-[0.625rem] text-danger mt-1">{errors.groupId.message}</p>}
        </div>

        {/* Title */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-[0.625rem] font-bold text-muted uppercase tracking-wide">
              Title
            </label>
            <span className={`text-[0.625rem] tabular-nums ${titleValue.length > 180 ? 'text-danger font-semibold' : 'text-muted'}`}>
              {titleValue.length} / 200
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="What's on your mind?"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 ${
              errors.title ? 'border-danger bg-red-50' : 'border-border'
            }`}
          />
          {errors.title && <p className="text-[0.625rem] text-danger mt-1">{errors.title.message}</p>}
        </div>

        {/* Type-specific fields */}
        {type === 'text' && (
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                Content <span className="normal-case font-normal">(optional)</span>
              </label>
              <span className={`text-[0.625rem] tabular-nums ${contentDisplayLength > 9500 ? 'text-danger font-semibold' : 'text-muted'}`}>
                {contentDisplayLength} / 10,000
              </span>
            </div>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <ContentField
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  groupId={groupIdValue || undefined}
                  rows={5}
                  placeholder="Share more details…"
                />
              )}
            />
          </div>
        )}

        {type === 'link' && (
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
                URL
              </label>
              <input
                {...register('linkUrl')}
                type="url"
                placeholder="https://"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                  errors.linkUrl ? 'border-danger bg-red-50' : 'border-border'
                }`}
              />
              {errors.linkUrl && <p className="text-[0.625rem] text-danger mt-1">{errors.linkUrl.message}</p>}
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                  Description <span className="normal-case font-normal">(optional)</span>
                </label>
                <span className={`text-[0.625rem] tabular-nums ${contentDisplayLength > 9500 ? 'text-danger font-semibold' : 'text-muted'}`}>
                  {contentDisplayLength} / 10,000
                </span>
              </div>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ContentField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    groupId={groupIdValue || undefined}
                    rows={3}
                    placeholder="Add a description…"
                  />
                )}
              />
            </div>
          </div>
        )}

        {type === 'photo' && (
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <label className="block text-[0.625rem] font-bold text-muted uppercase tracking-wide mb-1">
                Photo
              </label>
              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
                  {photos.map(({ preview }, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={preview} alt={`Preview ${i + 1}`} className="w-20 h-20 rounded-lg object-cover bg-gray-50 dark:bg-[#1a1a1a]" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                        className="absolute -top-1.5 -right-1.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.6rem] leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 10 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl h-28 flex flex-col items-center justify-center gap-1.5 text-muted cursor-pointer transition ${
                    isDragActive ? 'border-primary bg-blue-50 dark:bg-blue-950' : 'border-border hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <span className="text-sm">Drop photos here</span>
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="text-xs font-medium">
                        {photos.length === 0 ? 'Tap to select photos' : 'Add more photos'}
                      </span>
                      <span className="text-[0.625rem]">
                        JPEG · PNG · WebP · max 10 MB · {photos.length} / 10
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[0.625rem] font-bold text-muted uppercase tracking-wide">
                  Caption <span className="normal-case font-normal">(optional)</span>
                </label>
                <span className={`text-[0.625rem] tabular-nums ${contentDisplayLength > 9500 ? 'text-danger font-semibold' : 'text-muted'}`}>
                  {contentDisplayLength} / 10,000
                </span>
              </div>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ContentField
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    groupId={groupIdValue || undefined}
                    rows={3}
                    placeholder="Add a caption…"
                  />
                )}
              />
            </div>
          </div>
        )}

        {errors.root && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl">
            <p className="text-xs text-danger">{errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-accent text-accent-text-fg text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
        >
          {isSubmitting && <Spinner size="sm" />}
          Post
        </button>
      </form>
    </div>
  )
}
