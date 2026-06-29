import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card/40 border-t border-border mt-24">
      <div className="container mx-auto px-4 md:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-2xl text-silver-bright">
            RIDE<span className="text-primary italic">chic</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Arrive with distinction. Premium chauffeur and limousine service for executives, weddings,
            airport transfers, and special occasions.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="text-muted-foreground hover:text-silver-bright">About us</Link></li>
            <li><Link to="/services" className="text-muted-foreground hover:text-silver-bright">Services</Link></li>
            <li><Link to="/fleet" className="text-muted-foreground hover:text-silver-bright">Our fleet</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-silver-bright">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /><a href="tel:+16174835676">+1 617 483 5676</a></li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-primary" /><a href="mailto:info@ridechic.com">info@ridechic.com</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Follow</h4>
          <div className="flex gap-3">
            {[
              { href: "https://facebook.com/ridechic", Icon: Facebook },
              { href: "https://x.com/ridechicaz", Icon: Twitter },
              { href: "https://linkedin.com/company/ridechic", Icon: Linkedin },
              { href: "https://instagram.com/ridechic", Icon: Instagram },
            ].map(({ href, Icon }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="size-10 grid place-items-center rounded-full border border-border text-silver hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-4 md:px-8 py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Ride Chic. All rights reserved.</span>
          <span>Arrive with distinction.</span>
        </div>
      </div>
    </footer>
  );
}
