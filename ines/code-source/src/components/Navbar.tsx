import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

const routeLinks = [
  { name: "Accueil", href: "/" },
  { name: "Galerie", href: "/galerie" },
  { name: "Soins", href: "/soins" },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const footer = document.querySelector("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled ? "glass shadow-elevation-2" : "bg-transparent"
      )}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link to="/" className="group" aria-label="bayaNail - Accueil">
          <span className="font-display text-2xl tracking-wide text-charcoal transition-colors group-hover:text-rose-dark">
            baya<span className="italic text-or-discret">Nail</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-10 lg:flex">
          {routeLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "font-heading text-[0.8rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300",
                isActive(link.href)
                  ? "text-charcoal"
                  : "text-gris-moyen hover:text-charcoal"
              )}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={scrollToContact}
            className="font-heading text-[0.8rem] font-medium uppercase tracking-[0.2em] text-gris-moyen transition-colors duration-300 hover:text-charcoal"
          >
            Contact
          </button>
        </div>

        {/* CTA Desktop */}
        <div className="hidden lg:block">
          <Link to="/reservation" className="btn-premium text-xs">
            Réserver
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center lg:hidden"
          aria-label="Menu"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-charcoal" />
          ) : (
            <Menu className="h-6 w-6 text-charcoal" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 top-20 z-40 flex flex-col bg-creme transition-all duration-500 lg:hidden",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0"
        )}
      >
        <div className="flex flex-col items-center gap-8 pt-16">
          {routeLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "font-heading text-sm font-medium uppercase tracking-[0.25em] transition-colors",
                isActive(link.href) ? "text-charcoal" : "text-gris-moyen"
              )}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={scrollToContact}
            className="font-heading text-sm font-medium uppercase tracking-[0.25em] text-gris-moyen transition-colors"
          >
            Contact
          </button>
          <Link
            to="/reservation"
            onClick={() => setIsOpen(false)}
            className="btn-premium mt-4"
          >
            Réserver
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
