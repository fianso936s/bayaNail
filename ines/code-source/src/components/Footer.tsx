import React from "react";
import { Link } from "react-router-dom";
import { Instagram, MapPin, Clock, Phone } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal pb-8 pt-20 text-white/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="block">
              <span className="font-display text-2xl tracking-wide text-white">
                baya<span className="italic text-or-discret">Nail</span>
              </span>
            </Link>
            <p className="max-w-xs font-body text-sm leading-relaxed text-white/50">
              Bar à Ongles Express & Quality.
              <br />
              L'art de sublimer vos mains avec élégance et précision.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-or-discret"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
              <span className="font-heading text-xs uppercase tracking-widest">
                @bayanail
              </span>
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-6 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              Explorer
            </h4>
            <ul className="space-y-3">
              {[
                { name: "Accueil", href: "/" },
                { name: "Galerie", href: "/galerie" },
                { name: "Nos Soins", href: "/soins" },
                { name: "Réservation", href: "/reservation" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-white/50 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Horaires */}
          <div>
            <h4 className="mb-6 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              Horaires
            </h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-or-discret" />
                <div>
                  <p>Lun — Ven : 9h30 – 20h</p>
                  <p>Sam : 10h – 19h</p>
                  <p>Dim : Fermé</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-6 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-or-discret" />
                <span>06 XX XX XX XX</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-or-discret" />
                <span>
                  Front Populaire
                  <br />
                  Aubervilliers (93)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="font-body text-xs text-white/30">
            &copy; {new Date().getFullYear()} bayaNail — Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
