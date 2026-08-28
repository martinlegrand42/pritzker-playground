import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { ProductCard } from '@/components/new-arrivals/product-card'
import { buildProducts } from '@/components/new-arrivals/products'

const NAV_LINKS = [
  'New Arrivals',
  'Ready-to-Wear',
  'Dresses',
  'Knitwear',
  'Outerwear',
  'Denim',
  'Accessories',
  'Sale',
]

async function getSamoyedImage(): Promise<string | null> {
  try {
    const res = await fetch('https://dog.ceo/api/breed/samoyed/images/random', {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    const message = (data as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  } catch {
    return null
  }
}

export default async function NewArrivalsPage() {
  const samoyedImage = await getSamoyedImage()
  const products = buildProducts(samoyedImage)

  return (
    <>
      <div className="border-b border-[#e4ddd0] bg-[#1c1a17] py-2 text-center text-[11px] tracking-[0.15em] text-[#faf8f4] uppercase">
        Complimentary shipping on all U.S. orders
      </div>

      <header className="border-b border-[#e4ddd0]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex flex-1 items-center gap-4">
            <Menu className="h-5 w-5 md:hidden" strokeWidth={1.25} />
            <Search className="hidden h-5 w-5 md:block" strokeWidth={1.25} />
          </div>

          <h1
            className="flex-1 text-center text-2xl tracking-[0.25em] uppercase"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Ulla Johnson
          </h1>

          <div className="flex flex-1 items-center justify-end gap-4">
            <User className="hidden h-5 w-5 md:block" strokeWidth={1.25} />
            <Heart className="hidden h-5 w-5 md:block" strokeWidth={1.25} />
            <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
          </div>
        </div>

        <nav className="hidden justify-center gap-8 border-t border-[#e4ddd0] py-3 md:flex">
          {NAV_LINKS.map((link) => (
            <span
              key={link}
              className="cursor-default text-[12px] tracking-[0.08em] text-[#1c1a17]"
            >
              {link}
            </span>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-baseline justify-between">
          <h2
            className="text-3xl tracking-[0.05em]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            New Arrivals
          </h2>
          <span className="text-[12px] tracking-[0.08em] text-[#6b6156]">
            {products.length} items
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      <footer className="border-t border-[#e4ddd0] bg-[#1c1a17] text-[#faf8f4]">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center">
          <p className="text-sm tracking-[0.08em] uppercase">Sign up for updates</p>
          <p className="mx-auto mt-3 max-w-md text-[13px] text-[#c9c3b6]">
            Be the first to know about new collections, exclusive offers, and events.
          </p>
          <div className="mx-auto mt-5 flex max-w-sm items-center border-b border-[#c9c3b6]">
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-transparent py-2 text-sm placeholder:text-[#c9c3b6] focus:outline-none"
            />
            <button className="text-[12px] tracking-[0.08em] uppercase">Subscribe</button>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 border-t border-[#3a362f] px-6 py-12 text-[12px] tracking-[0.05em] text-[#c9c3b6] md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-[#faf8f4]">Customer Care</p>
            <span>Contact Us</span>
            <span>Shipping &amp; Returns</span>
            <span>FAQ</span>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[#faf8f4]">About</p>
            <span>Our Story</span>
            <span>Sustainability</span>
            <span>Stores</span>
          </div>
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <p className="text-[#faf8f4]">Connect</p>
            <span>Instagram</span>
            <span>Pinterest</span>
          </div>
        </div>

        <div className="border-t border-[#3a362f] px-6 py-6 text-center text-[11px] tracking-[0.08em] text-[#c9c3b6]">
          © {new Date().getFullYear()} Ulla Johnson — layout study, not affiliated with the brand.
        </div>
      </footer>
    </>
  )
}
