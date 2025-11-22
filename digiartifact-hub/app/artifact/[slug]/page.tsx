import { notFound } from 'next/navigation'
import { artifacts } from '@/data/artifacts'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Play, Shield, Package, FileText, Calendar, Tag } from 'lucide-react'
import AudioDemoButton from '@/components/AudioDemoButton'

export function generateStaticParams() {
  return artifacts.map((artifact) => ({
    slug: artifact.slug,
  }))
}

export default function ArtifactDetailPage({ params }: { params: { slug: string } }) {
  const artifact = artifacts.find(a => a.slug === params.slug)
  
  if (!artifact) {
    notFound()
  }

  const rarityColor = {
    gold: 'text-rarity-gold',
    silver: 'text-rarity-silver',
    standard: 'text-slate-400'
  }[artifact.rarity]

  return (
    <main className="min-h-screen pt-20 md:pt-8 px-4 sm:px-6 pb-24 md:pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          href={`/${artifact.type === 'visual' ? 'gallery' : artifact.type === 'audio' ? 'studio' : 'terminal'}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-gold transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">Back to {artifact.type === 'visual' ? 'Gallery' : artifact.type === 'audio' ? 'Studio' : 'Terminal'}</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square sm:aspect-[4/3] excavation-border overflow-hidden bg-slate/20">
              <Image
                src={artifact.thumbnail}
                alt={artifact.title}
                fill
                className="object-cover"
                priority
              />
              {/* Rarity Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-mono text-xs uppercase ${
                artifact.rarity === 'gold' ? 'bg-rarity-gold text-obsidian' :
                artifact.rarity === 'silver' ? 'bg-rarity-silver text-obsidian' :
                'bg-slate text-sand'
              }`}>
                {artifact.rarity}
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {artifact.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {artifact.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square excavation-border overflow-hidden bg-slate/20 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
                      Preview {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Title & Category */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-slate/30 rounded font-mono text-xs text-hologram-cyan uppercase">
                  {artifact.type}
                </span>
                <span className="px-2 py-1 bg-slate/30 rounded font-mono text-xs text-sand">
                  {artifact.category}
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-sand mb-3">
                {artifact.title}
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                {artifact.description}
              </p>
            </div>

            {/* Price & Purchase */}
            <div className="excavation-border bg-slate/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 font-mono mb-1">Price</p>
                  <p className="text-3xl font-bold text-gold">${artifact.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-mono mb-1">License</p>
                  <p className="text-lg font-mono text-sand capitalize">{artifact.license}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <a
                  href={artifact.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-rune w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Purchase Now
                </a>
                
                {artifact.demoUrl && (
                  <AudioDemoButton
                    artifactId={artifact.id}
                    title={artifact.title}
                    demoUrl={artifact.demoUrl}
                    thumbnail={artifact.thumbnail}
                    type={artifact.type}
                  />
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="space-y-3 mb-6">
              {artifact.fileSize && (
                <div className="flex items-center gap-3 text-sm">
                  <Package className="w-4 h-4 text-hologram-cyan" />
                  <span className="text-slate-500 font-mono">File Size:</span>
                  <span className="text-sand">{artifact.fileSize}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-hologram-cyan" />
                <span className="text-slate-500 font-mono">Released:</span>
                <span className="text-sand">{new Date(artifact.releaseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-hologram-cyan" />
                <span className="text-slate-500 font-mono">License:</span>
                <span className="text-sand capitalize">{artifact.license} Use</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gold" />
                <span className="font-mono text-sm text-gold uppercase">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {artifact.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate/30 rounded-full text-xs font-mono text-sand hover:bg-slate/50 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Description Section */}
        <div className="mt-12 lg:mt-16 excavation-border bg-slate/20 p-6 sm:p-8">
          <h2 className="font-display text-2xl sm:text-3xl text-gold mb-4">Full Description</h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed whitespace-pre-line">
            {artifact.longDescription}
          </p>
        </div>

        {/* Bonus Content */}
        {artifact.bonusContent && artifact.bonusContent.length > 0 && (
          <div className="mt-8 excavation-border bg-slate/20 p-6 sm:p-8">
            <h2 className="font-display text-2xl sm:text-3xl text-gold mb-4">What&apos;s Included</h2>
            <ul className="space-y-3">
              {artifact.bonusContent.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-hologram-cyan flex-shrink-0 mt-0.5" />
                  <span className="text-sand">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Artifacts */}
        <div className="mt-12 lg:mt-16">
          <h2 className="font-display text-2xl sm:text-3xl text-sand mb-6">More Like This</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {artifacts
              .filter(a => a.id !== artifact.id && (a.type === artifact.type || a.category === artifact.category))
              .slice(0, 3)
              .map(related => (
                <Link
                  key={related.id}
                  href={`/artifact/${related.slug}`}
                  className="excavation-border bg-slate/20 overflow-hidden hover:scale-105 transition-transform"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={related.thumbnail}
                      alt={related.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg text-sand mb-2">{related.title}</h3>
                    <p className="text-sm text-slate-400 mb-3">{related.description}</p>
                    <p className="text-gold font-bold">${related.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  )
}
