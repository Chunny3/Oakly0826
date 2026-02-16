'use client'
import Link from 'next/link'

export default function LinkArrow({ children, href = '#' }) {
  return (
    <Link href={href} className="readmore">
      {children}
    </Link>
  )
}