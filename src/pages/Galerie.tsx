import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParallaxImage } from "../components/ui/ScrollAnimation";

const categories = ["Tout", "French", "Milky", "Chrome", "Nail Art", "Natural"];

const galleryItems = [
  {
    src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
    title: "French Classique",
    category: "French",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80",
    title: "Milky Opalescent",
    category: "Milky",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&q=80",
    title: "Chrome Doré",
    category: "Chrome",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80",
    title: "Baby Boomer",
    category: "French",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1571290274554-6a2eaa74d75b?w=800&q=80",
    title: "Nail Art Floral",
    category: "Nail Art",
    span: "md:col-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1610992015732-2449b0e0df30?w=600&q=80",
    title: "Nude Naturel",
    category: "Natural",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1583255448430-17c5eda08e5c?w=600&q=80",
    title: "Chrome Argenté",
    category: "Chrome",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=600&q=80",
    title: "Milky Rose",
    category: "Milky",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    title: "Art Géométrique",
    category: "Nail Art",
    span: "md:col-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1625247661636-bac1e69c33e7?w=600&q=80",
    title: "French Moderne",
    category: "French",
    span: "",
  },
];

const Galerie: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const filtered =
    activeCategory === "Tout"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen pt-28">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="font-display text-charcoal">
            Artistry
            <br />
            <span className="italic text-rose-dark">Defined.</span>
          </h1>
          <p className="mt-6 max-w-lg font-body text-lg text-gris-moyen">
            Une sélection de nos plus belles réalisations. Chaque main raconte
            une histoire de style et de précision.
          </p>
        </motion.div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-12">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-sm px-5 py-2.5 font-heading text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-charcoal text-white"
                  : "bg-gris-chaud text-gris-moyen hover:bg-rose-light hover:text-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-12">
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className={`group relative overflow-hidden rounded-xl ${item.span}`}
              >
                <ParallaxImage
                  src={item.src}
                  srcSet={`${item.src.replace(/w=\d+/, 'w=400')} 400w, ${item.src.replace(/w=\d+/, 'w=800')} 800w, ${item.src.replace(/w=\d+/, 'w=1200')} 1200w`}
                  sizes={item.span ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                  alt={item.title}
                  speed={0.15}
                  className="aspect-square"
                  imgClassName="scale-[1.15] transition-transform duration-700 group-hover:scale-[1.25]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="font-heading text-xs font-medium uppercase tracking-[0.15em] text-white/70">
                    {item.category}
                  </p>
                  <p className="mt-1 font-display text-lg text-white">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* CTA Bottom */}
      <section className="bg-gris-chaud py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
          <div>
            <h2 className="font-display text-charcoal">
              Your Canvas <span className="italic">Awaits.</span>
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-md font-body text-gris-moyen">
              Inspirée par nos réalisations ? Prenez rendez-vous et laissez
              notre équipe créer votre prochain chef-d'oeuvre.
            </p>
            <a href="/reservation" className="btn-premium">
              Réserver maintenant
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Galerie;
