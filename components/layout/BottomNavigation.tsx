'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Processing', href: '/processing', icon: '⚙️' },
  { name: 'Results', href: '/results', icon: '✨' },
  { name: 'Notify', href: '/notifications', icon: '🔔' },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10">
      <div className="flex justify-around items-center h-20 max-w-screen-sm mx-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
                isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.name}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
