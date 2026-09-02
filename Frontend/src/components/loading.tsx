import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className ?? ''}`} />
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <aside className="hidden w-[228px] border-r border-[#e5e7eb] bg-white p-5 md:block">
        <div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-[9px]" /><Skeleton className="h-3 w-20" /></div>
        <Skeleton className="mt-10 h-2 w-16" />
        <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-7 w-full" />)}</div>
        <Skeleton className="mt-[calc(100vh-220px)] h-8 w-full" />
      </aside>
      <main className="flex-1">
        <header className="flex h-[68px] items-center justify-end gap-3 border-b border-[#e5e7eb] bg-white px-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-7 w-7 rounded-full" /></header>
        <div className="mx-auto max-w-[1280px] space-y-7 p-5 sm:p-9"><div className="space-y-3"><Skeleton className="h-2.5 w-28" /><Skeleton className="h-7 w-56" /><Skeleton className="h-2.5 w-44" /></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-md border border-[#e2e5e8] bg-white p-4"><Skeleton className="h-2.5 w-20" /><Skeleton className="mt-4 h-7 w-10" /><Skeleton className="mt-2 h-2 w-24" /></div>)}</div><div className="overflow-hidden rounded-md border border-[#e2e5e8] bg-white"><Skeleton className="m-4 h-3 w-28" />{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex items-center justify-between border-t border-[#f0f1f2] px-4 py-4"><Skeleton className="h-2.5 w-48" /><Skeleton className="h-4 w-16" /></div>)}</div></div>
      </main>
    </div>
  )
}
