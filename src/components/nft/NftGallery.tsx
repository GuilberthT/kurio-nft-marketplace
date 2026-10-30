import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NftGalleryProps {
  images: string[]
  name: string
}

export function NftGallery({ images, name }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
      <ul aria-label="Imagens do NFT" className="flex gap-3 sm:flex-col sm:gap-4">
        {images.map((src, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={selected === index}
              className={cn(
                'block overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-ring',
                selected === index ? 'border-primary' : 'border-transparent',
              )}
            >
              <img src={src} alt="" width={100} height={100} className="size-16 object-cover sm:size-[100px]" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-1 rounded-md bg-card p-5">
        <img
          src={images[selected]}
          alt={`${name}, imagem ${selected + 1} de ${images.length}`}
          width={404}
          height={500}
          fetchPriority="high"
          className="aspect-[404/500] w-full rounded-3xl object-cover"
        />
      </div>
    </div>
  )
}