import {
    CATEGORIES,
    NETWORKS,
    type Category,
    type Network,
    type Nft,
    type NftEdition,
} from '@/types/nft'

const ART = {
    marrom: '/nfts/kurio-ape-marrom.webp',
    cinza: '/nfts/kurio-ape-cinza.webp',
    preto: '/nfts/kurio-ape-preto.webp',
    dourado: '/nfts/kurio-ape-dourado.webp',
} as const
type Art = keyof typeof ART

const ART_ATTRIBUTES: Record<Art, string[]> = {
    marrom: ['Óculos', 'Esmeralda', 'Raro'],
    cinza: ['Chapéu', 'Moletom', 'Comum'],
    preto: ['Brinco', 'Blazer', 'Épico'],
    dourado: ['Fones', 'Jaqueta', 'Lendário'],
}

interface Seed {
    name: string
    tokenId: string
    art: Art
    priceEth: string
    compareAtPriceEth?: string
    category: Category
    network: Network
}

const FIGMA_SEEDS: Seed[] = [
    { name: 'Emerald Ape #042', tokenId: '#0042', art: 'marrom', priceEth: '1.19', category: 'arte-digital', network: 'ethereum' },
    { name: 'Sage Nomad #009', tokenId: '#0009', art: 'cinza', priceEth: '1.69', category: 'arte-digital', network: 'polygon' },
    { name: 'Neon Vessel #552', tokenId: '#0552', art: 'preto', priceEth: '1.99', compareAtPriceEth: '2.29', category: 'colecionaveis', network: 'ethereum' },
    { name: 'Cosmic Bloom #118', tokenId: '#0118', art: 'cinza', priceEth: '1.29', category: 'generativa', network: 'solana' },
    { name: 'Violet Nomad #314', tokenId: '#0314', art: 'cinza', priceEth: '1.39', category: 'fotografia', network: 'polygon' },
    { name: 'Ivory Baron #088', tokenId: '#0088', art: 'preto', priceEth: '1.79', category: 'arte-3d', network: 'ethereum' },
    { name: 'Golden Beat #207', tokenId: '#0207', art: 'dourado', priceEth: '0.99', category: 'musica', network: 'solana' },
     { name: 'Golden Signal #160', tokenId: '#0160', art: 'dourado', priceEth: '0.39', category: 'musica', network: 'ethereum' },
]

const ADJECTIVES = ['Amber', 'Cobalt', 'Lunar', 'Rustic', 'Velvet', 'Copper', 'Misty', 'Solar']
const NOUNS = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Signal']
const ARTS: Art[] = ['marrom', 'cinza', 'preto', 'dourado']

function centsToEth(cents: number): string {
    const whole = Math.floor(cents / 100)
    const rest = String(cents % 100).padStart(2, '0')
    return `${whole}.${rest}`
}

function generatedSeed(index: number): Seed {
    const n = 500 + index
    return {
        name: `${ADJECTIVES[index % ADJECTIVES.length]} ${NOUNS[index % NOUNS.length]} #${n}`,
        tokenId: `#${String(n).padStart(4, '0')}`,
        art: ARTS[index % ARTS.length],
        priceEth: centsToEth(2 + ((index * 37) % 1229)),
        category: CATEGORIES[index % CATEGORIES.length],
        network: NETWORKS[index % NETWORKS.length],
    }
}

function toId(name: string): string {
    return name.toLowerCase().replace('#', '').replace(/\s+/g, '-')
}

function editionsFor(index: number): NftEdition[] {
    return [
        { type: '1/1', available: index % 4 === 0 ? 0 : 1 },
        { type: '1/10', available: 10 - (index % 10) },
        { type: '1/50', available: 50 - (index % 7) },
        { type: 'aberta', available: 999 },
    ]
}

function buildNft(seed: Seed, index: number): Nft {
    const image = ART[seed.art]
    return {
        id: toId(seed.name),
        tokenId: seed.tokenId,
        name: seed.name,
        collection: 'Kurio Apes',
        category: seed.category,
        network: seed.network,
        description:
        'Um colecionável digital finalizado à mão da coleção Kurio Editions, com arte desbloqueável e acesso para colecionadores.',
        attributes: ART_ATTRIBUTES[seed.art],
        images: [image, image, image, image],
        priceEth: seed.priceEth,
        compareAtPriceEth: seed.compareAtPriceEth,
        editions: editionsFor(index),
        rating: 4 + (index % 10) / 10,
        reviewCount: 5 + ((index * 7) % 40),
        listedAt: new Date(Date.UTC(2026, 9, 28) - index * 3_600_000).toISOString(),
        trendingScore: (index * 53) % 100,
        version: 1,
    }
}

const GENERATED_SEEDS = Array.from({ length: 28 }, (_, i) => generatedSeed(i))

export const NFT_FIXTURES: Nft[] = [...FIGMA_SEEDS, ...GENERATED_SEEDS].map(buildNft)