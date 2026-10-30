import { buttonVariants } from '@/components/ui/button'

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-10 py-10 md:grid-cols-[1fr_450px] md:py-12">
      <div className="md:pl-10">
        <p className="text-sm tracking-wide">Bem-vindo à Kurio</p>
        <h1 id="hero-title" className="mt-4 text-3xl leading-tight font-bold sm:text-[42px] sm:leading-17.5">
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p className="mt-4 max-w-140 text-sm leading-6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
          apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <a href="#catalogo" className={buttonVariants({ className: 'mt-8 h-10 px-7 font-bold' })}>
          EXPLORAR
        </a>
      </div>
      <img
        src="/nfts/kurio-ape-marrom.webp"
        alt="Emerald Ape #042: macaco de óculos redondos e jaqueta verde"
        width={450}
        height={450}
        fetchPriority="high"
        className="aspect-square w-full rounded-3xl object-cover"
      />
    </section>
  )
}