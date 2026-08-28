import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'

const serif = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'New Arrivals',
  description: 'A layout study reproducing a fashion collection page.',
}

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} flex flex-1 flex-col bg-[#faf8f4] text-[#1c1a17]`}>
      {children}
    </div>
  )
}
