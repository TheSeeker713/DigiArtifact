import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-baked-clay bg-obsidian/95 py-12 px-6 md:ml-64">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-xl text-relic-gold mb-2">DIGIARTIFACT</h3>
            <p className="text-sm text-text-slate font-mono mb-4">
              The Digital Curiosity Shop
            </p>
            <p className="text-xs text-text-slate">
              Premium digital assets for creators and dreamers. Where ancient wisdom meets future technology.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-mono text-sm text-sand mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-text-slate">
              <li><Link href="/gallery" className="hover:text-relic-gold transition-colors">The Gallery</Link></li>
              <li><Link href="/studio" className="hover:text-relic-gold transition-colors">The Studio</Link></li>
              <li><Link href="/terminal" className="hover:text-relic-gold transition-colors">The Terminal</Link></li>
              <li><Link href="/vault" className="hover:text-relic-gold transition-colors">Vault Access</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-mono text-sm text-sand mb-3">Legal & Support</h4>
            <ul className="space-y-2 text-sm text-text-slate">
              <li><Link href="/terms" className="hover:text-relic-gold transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-relic-gold transition-colors">Privacy Policy</Link></li>
              <li><Link href="/licenses" className="hover:text-relic-gold transition-colors">License Information</Link></li>
              <li><a href="mailto:hello@digiartifact.com" className="hover:text-relic-gold transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-6 border-t border-baked-clay/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-slate font-mono">
            © {new Date().getFullYear()} DigiArtifact LLC · Crafted in New Mexico
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://etsy.com/shop/digiartifact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-slate hover:text-relic-gold transition-colors"
            >
              Etsy
            </a>
            <a
              href="https://ko-fi.com/digiartifact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-slate hover:text-relic-gold transition-colors"
            >
              Ko-fi
            </a>
            <a
              href="https://twitter.com/digiartifact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-slate hover:text-relic-gold transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
