export default function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-xl mx-2 mb-2 p-3">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3 skeleton rounded w-32 mb-1" />
          <div className="h-2 skeleton rounded w-16" />
        </div>
      </div>
      <div className="h-3 skeleton rounded w-3/4 mb-1.5" />
      <div className="h-2 skeleton rounded w-full mb-1" />
      <div className="h-2 skeleton rounded w-4/5" />
    </div>
  )
}
