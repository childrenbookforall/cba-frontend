import { useDropzone, type FileRejection } from 'react-dropzone'

const ACCEPTED_IMAGE_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

export function useImageDropzone({
  maxSize,
  onDrop,
  onDropRejected,
  disabled,
}: {
  maxSize: number
  onDrop: (accepted: File[]) => void
  onDropRejected?: (rejections: FileRejection[]) => void
  disabled?: boolean
}) {
  return useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize,
    multiple: true,
    onDropRejected,
    disabled,
  })
}
