// Placeholder product data. Names, prices, and swatch colors are stand-ins
// for the real catalog until actual product photography is dropped in.

export type PlaceholderProduct = {
  id: string
  name: string
  price: string
  kind: 'placeholder'
  colors: [string, string]
  hoverColors: [string, string]
}

export type PhotoProduct = {
  id: string
  name: string
  price: string
  kind: 'photo'
  src: string | null
  alt: string
}

export type Product = PlaceholderProduct | PhotoProduct

const PALETTES: [string, string][] = [
  ['#c17a54', '#e8c9a8'], // terracotta
  ['#8a8b5c', '#cfd0a8'], // olive
  ['#a8492f', '#dba98a'], // rust
  ['#d8c3a0', '#f3e9d8'], // sand
  ['#9caa8a', '#dbe3cd'], // sage
  ['#c99a95', '#ecd8d2'], // dusty rose
  ['#b08463', '#e4cdb0'], // clay
  ['#6f5a44', '#b79c7d'], // umber
]

function palette(i: number): [string, string] {
  return PALETTES[i % PALETTES.length]
}

const PLACEHOLDER_NAMES: { name: string; price: string }[] = [
  { name: 'Solene Blouse', price: '$445' },
  { name: 'Marlow Skirt', price: '$525' },
  { name: 'Odette Knit Cardigan', price: '$685' },
  { name: 'Noa Wide-Leg Trouser', price: '$495' },
  { name: 'Camille Silk Camisole', price: '$365' },
  { name: 'Rosa Puff-Sleeve Top', price: '$425' },
  { name: 'Anouk Denim Jacket', price: '$595' },
  { name: 'Ines Pleated Midi Dress', price: '$795' },
  { name: 'Talia Cropped Sweater', price: '$385' },
  { name: 'Josephine Wrap Coat', price: '$1,295' },
  { name: 'Sonia Print Maxi Dress', price: '$875' },
]

export function buildProducts(samoyedImage: string | null): Product[] {
  const placeholders: PlaceholderProduct[] = PLACEHOLDER_NAMES.map((p, i) => ({
    id: `placeholder-${i}`,
    kind: 'placeholder',
    name: p.name,
    price: p.price,
    colors: palette(i),
    hoverColors: palette(i + 3),
  }))

  const samoyed: PhotoProduct = {
    id: 'samoyed',
    kind: 'photo',
    name: 'Bibi Dress',
    price: '$695',
    src: samoyedImage,
    alt: 'A fluffy white Samoyed dog standing in for the product photo',
  }

  return [samoyed, ...placeholders]
}
