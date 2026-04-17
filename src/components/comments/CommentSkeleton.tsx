export default function CommentSkeleton() {
  return (
    <div className="mb-4 animate-pulse">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-12" />
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}
