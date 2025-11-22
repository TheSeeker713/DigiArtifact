export interface Artifact {
  id: string
  slug: string
  title: string
  type: 'visual' | 'audio' | 'interactive'
  category: string
  description: string
  longDescription: string
  rarity: 'gold' | 'silver' | 'standard'
  price: number
  thumbnail: string
  images: string[]
  tags: string[]
  releaseDate: string
  purchaseLink: string
  demoUrl?: string
  fileSize?: string
  license: 'personal' | 'commercial'
  bonusContent?: string[]
}

export const artifacts: Artifact[] = [
  {
    id: '001',
    slug: 'dark-fantasy-coloring-book',
    title: 'Dark Fantasy Coloring Collection',
    type: 'visual',
    category: 'coloring-book',
    description: '50 intricate Gothic and fantasy designs for adult coloring enthusiasts.',
    longDescription: 'Immerse yourself in a world of dark elegance with this comprehensive collection of 50 intricate coloring pages. Each design features detailed Gothic architecture, mystical creatures, and fantasy landscapes perfect for adult coloring enthusiasts.',
    rarity: 'gold',
    price: 12.99,
    thumbnail: '/artifacts/dark-fantasy-thumb.svg',
    images: ['/artifacts/dark-fantasy-01.jpg', '/artifacts/dark-fantasy-02.jpg'],
    tags: ['fantasy', 'gothic', 'intricate', 'adult-coloring'],
    releaseDate: '2025-01-15',
    purchaseLink: 'https://etsy.com/listing/dark-fantasy-coloring',
    fileSize: '45 MB',
    license: 'personal',
    bonusContent: ['Bonus wallpaper pack', 'Tutorial PDF', 'Color palette guide']
  },
  {
    id: '002',
    slug: 'ambient-fantasy-music-vol1',
    title: 'Ambient Fantasy Music Vol.1',
    type: 'audio',
    category: 'music-album',
    description: '12 atmospheric tracks for creative projects and relaxation.',
    longDescription: 'A carefully crafted collection of ambient fantasy music designed for creators and dreamers. Perfect for YouTube videos, podcasts, meditation, or background ambiance while working.',
    rarity: 'silver',
    price: 19.99,
    thumbnail: '/artifacts/ambient-music-thumb.svg',
    images: ['/artifacts/ambient-music-cover.jpg'],
    tags: ['ambient', 'fantasy', 'royalty-free', 'creative-commons'],
    releaseDate: '2025-01-20',
    purchaseLink: 'https://ko-fi.com/s/ambient-fantasy-vol1',
    demoUrl: '/audio/ambient-fantasy-preview.mp3',
    fileSize: '120 MB',
    license: 'commercial',
    bonusContent: ['Stem files', 'Extended versions', 'License certificate']
  },
  {
    id: '003',
    slug: 'mystic-manor-visual-novel',
    title: 'Mystic Manor: Chapter 1',
    type: 'interactive',
    category: 'visual-novel',
    description: 'A story-driven mystery visual novel with multiple endings.',
    longDescription: 'Explore the secrets of Mystic Manor in this choice-driven visual novel. Your decisions shape the story across 3+ hours of gameplay with 5 unique endings to discover.',
    rarity: 'gold',
    price: 9.99,
    thumbnail: '/artifacts/mystic-manor-thumb.svg',
    images: ['/artifacts/mystic-manor-01.jpg', '/artifacts/mystic-manor-02.jpg'],
    tags: ['visual-novel', 'mystery', 'interactive', 'story-driven'],
    releaseDate: '2025-02-01',
    purchaseLink: 'https://gumroad.com/l/mystic-manor-ch1',
    demoUrl: '/demos/mystic-manor',
    fileSize: '250 MB',
    license: 'personal',
    bonusContent: ['Artbook PDF', 'Soundtrack', 'Behind-the-scenes']
  },
  {
    id: '004',
    slug: 'botanical-oil-paintings',
    title: 'Botanical Oil Painting Collection',
    type: 'visual',
    category: 'digital-art',
    description: '20 high-resolution botanical oil paintings for print.',
    longDescription: 'Exquisite botanical artwork perfect for home decor, print-on-demand, or digital use. Each painting is rendered in stunning detail at 300 DPI.',
    rarity: 'standard',
    price: 15.99,
    thumbnail: '/artifacts/botanical-thumb.svg',
    images: ['/artifacts/botanical-01.jpg', '/artifacts/botanical-02.jpg'],
    tags: ['botanical', 'oil-painting', 'high-res', 'print-ready'],
    releaseDate: '2025-01-10',
    purchaseLink: 'https://etsy.com/listing/botanical-paintings',
    fileSize: '380 MB',
    license: 'commercial',
    bonusContent: ['Print guidelines', 'Frame mockups']
  },
  {
    id: '005',
    slug: 'fantasy-sound-effects-pack',
    title: 'Fantasy Sound Effects Pack',
    type: 'audio',
    category: 'sfx-pack',
    description: '200+ royalty-free fantasy sound effects for game dev and content creation.',
    longDescription: 'A comprehensive library of fantasy sound effects including magic spells, creature sounds, ambient environments, and UI effects. Perfect for game development and video production.',
    rarity: 'silver',
    price: 24.99,
    thumbnail: '/artifacts/fantasy-sfx-thumb.svg',
    images: ['/artifacts/fantasy-sfx-cover.jpg'],
    tags: ['sfx', 'fantasy', 'game-dev', 'royalty-free'],
    releaseDate: '2025-01-25',
    purchaseLink: 'https://gumroad.com/l/fantasy-sfx',
    demoUrl: '/audio/fantasy-sfx-demo.mp3',
    fileSize: '450 MB',
    license: 'commercial',
    bonusContent: ['Categorized folders', 'Metadata CSV', 'Usage guide']
  },
  {
    id: '006',
    slug: 'pixel-art-rpg-kit',
    title: 'Pixel Art RPG Asset Kit',
    type: 'interactive',
    category: 'game-assets',
    description: 'Complete pixel art asset pack for 2D RPG games.',
    longDescription: 'Everything you need to create a 2D RPG game including tilesets, character sprites, UI elements, and animated effects. Compatible with Unity, Godot, and other game engines.',
    rarity: 'gold',
    price: 29.99,
    thumbnail: '/artifacts/pixel-rpg-thumb.svg',
    images: ['/artifacts/pixel-rpg-01.jpg', '/artifacts/pixel-rpg-02.jpg'],
    tags: ['pixel-art', 'rpg', 'game-assets', '2d'],
    releaseDate: '2025-02-05',
    purchaseLink: 'https://ko-fi.com/s/pixel-rpg-kit',
    fileSize: '180 MB',
    license: 'commercial',
    bonusContent: ['Sprite sheets', 'Tile maps', 'Animation guidelines']
  },
]
