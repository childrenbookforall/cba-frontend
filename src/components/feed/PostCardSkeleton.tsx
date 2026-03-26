export default function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-xl mx-2 mb-2 p-3 animate-pulse">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-2 bg-gray-100 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" />
      <div className="h-2 bg-gray-100 rounded w-full mb-1" />
      <div className="h-2 bg-gray-100 rounded w-4/5" />
    </div>
  )
}
