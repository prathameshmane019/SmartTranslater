'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="py-4 px-6 bg-gray-50 dark:bg-gray-800">
      <nav className="flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          SmartTranslator
        </Link>
        
      </nav>
    </header>
  )
}