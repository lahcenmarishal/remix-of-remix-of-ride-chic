import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { useSeo } from "@/lib/useSeo";

export default function Contact() {
  useSeo({
    title: "Contact — Ride Chic",
    description: "Get in touch with Ride Chic. Phone, email, 24/7 service.",
  });
  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Contact</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl text-silver-bright">
            We're here, <span className="italic">always</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl">Questions about a route, a vehicle, or a special request? Reach out — we answer fast.</p>

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-card/60">
              <Phone className="size-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-silver-bright">Phone</h3>
              <a href="tel:+16174835676" className="mt-2 block text-lg text-silver hover:text-silver-bright">+1 617 483 5676</a>
              <p className="mt-2 text-sm text-muted-foreground">Available 24/7</p>
            </Card>
            <Card className="p-8 bg-card/60">
              <Mail className="size-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-silver-bright">Email</h3>
              <a href="mailto:info@ridechic.com" className="mt-2 block text-lg text-silver hover:text-silver-bright">info@ridechic.com</a>
              <p className="mt-2 text-sm text-muted-foreground">Replies within 1 hour</p>
            </Card>
            <Card className="p-8 bg-card/60">
              <MapPin className="size-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-silver-bright">Service area</h3>
              <p className="mt-2 text-silver">Boston metropolitan area and surrounding</p>
              <p className="mt-2 text-sm text-muted-foreground">Long-distance on request</p>
            </Card>
            <Card className="p-8 bg-card/60">
              <Clock className="size-8 text-primary mb-4" />
              <h3 className="font-display text-xl text-silver-bright">Hours</h3>
              <p className="mt-2 text-silver">24 hours / 7 days</p>
              <p className="mt-2 text-sm text-muted-foreground">Reserve any time, any day</p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
