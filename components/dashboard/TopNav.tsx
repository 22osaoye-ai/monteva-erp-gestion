import { Mountain } from 'lucide-react'

export function TopNav() {
  return (
    <nav className="bg-white border-b border-neutral-100 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-8 md:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-neutral-900 ">
            <Mountain size={24} strokeWidth={2.5} />
          </div>
          <span className="text-xl tracking-tight text-neutral-900">Monteva</span>
        </div>
      </div>
    </nav>
  )
}
