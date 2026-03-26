import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { useQueryClient } from '@tanstack/react-query'
import { createPost } from '../api/posts'
import { useGroups } from '../hooks/useGroups'
import { getApiError } from '../lib/utils'
import { useToast } from '../stores/toastStore'
import Spinner from '../components/ui/Spinner'

const Picker = lazy(() => import('@emoji-mart/react'))
import NavLinks from '../components/layout/NavLinks'

type PostType = 'text' | 'link' | 'photo'

const baseSchema = z.object({
  groupId: z.string().min(1, 'Select a group'),
  title: z.string().min(1, 'Title is required').max(200, 'Max 200 characters'),
  content: z.string().max(10000).optional(),
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
  const [type, setType] = useState<PostType>('text')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emojiData, setEmojiData] = useState<any>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const submittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(buildSchema(type)) })

  const titleValue = watch('title') ?? ''
  const contentValue = watch('content') ?? ''

  // Pre-fill group when there's only one option
  useEffect(() => {
    if (groups?.length === 1) {
      setValue('groupId', groups[0].id)
    }
  }, [groups, setValue])

  // Load emoji data on first open
  useEffect(() => {
    if (showEmojiPicker && !emojiData) {
      import('@emoji-mart/data').then((m) => setEmojiData(m.default))
    }
  }, [showEmojiPicker, emojiData])

  useEffect(() => {
    if (!showEmojiPicker) return
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showEmojiPicker])

  function handleEmojiSelect(emoji: { native: string }) {
    const el = contentTextareaRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newValue = el.value.slice(0, start) + emoji.native + el.value.slice(end)
    setValue('content', newValue, { shouldDirty: true })
    setShowEmojiPicker(false)
    // Restore cursor after emoji
    requestAnimationFrame(() => {
      const pos = start + emoji.native.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  function handleTypeChange(newType: PostType) {
    setType(newType)
    reset({ groupId: groups?.length === 1 ? groups[0].id : undefined })
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function onSubmit(data: Fields) {
    if (submittingRef.current) return
    if (type === 'photo' && !photoFile) {
      setError('root', { message: 'Please select a photo' })
      return
    }
    submittingRef.current = true
    try {
      await createPost({
        groupId: data.groupId,
        type,
        title: data.title,
        content: data.content,
        linkUrl: data.linkUrl,
        file: photoFile ?? undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast('Post shared')
      navigate('/feed')
    } catch (err) {
      setError('root', { message: getApiError(err) })
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <div className="min-h-svh bg-surface">
      <title>New Post — CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 transition" aria-label="Go back">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-sm font-bold text-gray-900 flex-1">New Post</h1>
        <NavLinks />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-4 max-w-lg mx-auto">
        {/* Type picker */}
        <div className="flex gap-2 mb-4">
          {(['text', 'link', 'photo'] as PostType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                type === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Group select */}
        <div className="mb-3">
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
            Group
          </label>
          {groups?.length === 1 ? (
            <div className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface text-gray-900">
              {groups[0].name}
            </div>
          ) : (
            <select
              {...register('groupId')}
              disabled={groupsLoading || groupsError || groups?.length === 0}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${
                errors.groupId ? 'border-danger' : 'border-border'
              }`}
            >
              <option value="">
                {groupsLoading
                  ? 'Loading groups…'
                  : groupsError
                  ? 'Could not load groups'
                  : groups?.length === 0
                  ? 'You are not in any groups yet'
                  : 'Select a group…'}
              </option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          {groups?.length === 0 && !groupsLoading && (
            <p className="text-[10px] text-muted mt-1">
              An admin needs to add you to a group before you can post.
            </p>
          )}
          {errors.groupId && <p className="text-[10px] text-danger mt-1">{errors.groupId.message}</p>}
        </div>

        {/* Title */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
              Title
            </label>
            <span className={`text-[10px] tabular-nums ${titleValue.length > 180 ? 'text-danger font-semibold' : 'text-muted'}`}>
              {titleValue.length} / 200
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="What's on your mind?"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.title ? 'border-danger bg-red-50' : 'border-border'
            }`}
          />
          {errors.title && <p className="text-[10px] text-danger mt-1">{errors.title.message}</p>}
        </div>

        {/* Type-specific fields */}
        {type === 'text' && (
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                Content <span className="normal-case font-normal">(optional)</span>
              </label>
              {contentValue.length > 0 && (
                <span className={`text-[10px] tabular-nums ${contentValue.length > 9500 ? 'text-danger font-semibold' : 'text-muted'}`}>
                  {contentValue.length} / 10,000
                </span>
              )}
            </div>
            <div className="relative">
              {showEmojiPicker && emojiData && (
                <div ref={emojiPickerRef} className="absolute top-full right-0 mt-1 z-50">
                  <Suspense fallback={null}>
                    <Picker data={emojiData} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} />
                  </Suspense>
                </div>
              )}
              <textarea
                {...register('content')}
                ref={(el) => {
                  register('content').ref(el)
                  contentTextareaRef.current = el
                }}
                rows={5}
                placeholder="Share more details…"
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                aria-label="Insert emoji"
                className="absolute bottom-2 right-2.5 text-lg leading-none text-muted hover:text-gray-600 transition"
              >
                🙂
              </button>
            </div>
          </div>
        )}

        {type === 'link' && (
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
              URL
            </label>
            <input
              {...register('linkUrl')}
              type="url"
              placeholder="https://"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.linkUrl ? 'border-danger bg-red-50' : 'border-border'
              }`}
            />
            {errors.linkUrl && <p className="text-[10px] text-danger mt-1">{errors.linkUrl.message}</p>}
          </div>
        )}

        {type === 'photo' && (
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">
                Photo
              </label>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-full rounded-xl object-contain max-h-64 bg-gray-50" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center gap-1.5 text-muted cursor-pointer transition ${
                    isDragActive ? 'border-primary bg-blue-50' : 'border-border hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <span className="text-sm">Drop the photo here</span>
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="text-xs font-medium">Tap to select a photo</span>
                      <span className="text-[10px]">JPEG · PNG · WebP · max 10 MB</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wide">
                  Caption <span className="normal-case font-normal">(optional)</span>
                </label>
                {contentValue.length > 0 && (
                  <span className={`text-[10px] tabular-nums ${contentValue.length > 9500 ? 'text-danger font-semibold' : 'text-muted'}`}>
                    {contentValue.length} / 10,000
                  </span>
                )}
              </div>
              <div className="relative">
                {showEmojiPicker && emojiData && (
                  <div ref={emojiPickerRef} className="absolute top-full right-0 mt-1 z-50">
                    <Suspense fallback={null}>
                      <Picker data={emojiData} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} />
                    </Suspense>
                  </div>
                )}
                <textarea
                  {...register('content')}
                  ref={(el) => {
                    register('content').ref(el)
                    contentTextareaRef.current = el
                  }}
                  rows={3}
                  placeholder="Add a caption…"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  aria-label="Insert emoji"
                  className="absolute bottom-2 right-2.5 text-lg leading-none text-muted hover:text-gray-600 transition"
                >
                  🙂
                </button>
              </div>
            </div>
          </div>
        )}

        {errors.root && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-danger">{errors.root.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition"
        >
          {isSubmitting && <Spinner size="sm" />}
          Post
        </button>
      </form>
    </div>
  )
}
