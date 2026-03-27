import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const soinCategories = [
  {
    number: "01",
    title: "Classic Care",
    items: [
      {
        name: "Manucure",
        description:
          "Limage, soin des cuticules et pose de vernis classique. Finition soignée.",
        price: "25€",
      },
      {
        name: "Pédicure",
        description:
          "Soin complet des pieds : gommage, cuticules et vernis pour des pieds sublimés.",
        price: "35€",
      },
      {
        name: "Manucure Express",
        description: "Limage et vernis express en 20 minutes. Idéal pause déjeuner.",
        price: "20€",
      },
    ],
  },
  {
    number: "02",
    title: "Advanced Techniques",
    items: [
      {
        name: "Pose Semi-Permanent",
        description:
          "Vernis gel longue tenue jusqu'à 3 semaines. Large choix de couleurs tendance.",
        price: "35€",
      },
      {
        name: "Dépose + Repose",
        description:
          "Dépose soigneuse et repose semi-permanent. Vos ongles restent en bonne santé.",
        price: "45€",
      },
      {
        name: "Gel Extensions",
        description:
          "Capsules gel, construction soignée, design sur-mesure. Tenue optimale.",
        price: "à partir de 55€",
      },
      {
        name: "Nail Art Custom",
        description:
          "French, milky, chrome, 3D, strass — votre design unique réalisé sur-mesure.",
        price: "dès 5€/ongle",
      },
    ],
  },
  {
    number: "03",
    title: "Wellness Rituals",
    items: [
      {
        name: "Soin Mains Complet",
        description:
          "Gommage, masque hydratant, massage relaxant. Vos mains retrouvent douceur et éclat.",
        price: "25€",
      },
      {
        name: "Soin Paraffine",
        description:
          "Bain de paraffine chaude pour hydrater en profondeur. Sensation de velours.",
        price: "15€",
      },
    ],
  },
];

const Tarifs: React.FC = () => {
  return (
    <div className="min-h-screen pt-28">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="mb-3 font-heading text-xs font-medium uppercase tracking-[0.3em] text-or-discret">
              Curated Selection
            </p>
            <h1 className="font-display text-charcoal">
              Menu des Soins
            </h1>
            <p className="mt-6 max-w-md font-body text-lg leading-relaxed text-gris-moyen">
              Une collection de soins experts et d'expressions artistiques
              conçus pour sublimer vos ongles et révéler votre style.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative overflow-hidden rounded-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&q=80"
              srcSet="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80 400w, https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&q=80 700w, https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80 1200w"
              sizes="(max-width: 1024px) 100vw, 50vw"
              alt="Pose signature bayaNail — vernis gel finition miroir"
              className="aspect-[4/3] w-full object-cover"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.style.backgroundColor = "#F5E6E8";
              }}
            />
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-4 py-2 backdrop-blur-sm">
              <p className="font-display text-sm italic text-charcoal">
                The Signature Glow
              </p>
              <p className="font-body text-xs text-gris-moyen">
                Notre soin iconique
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="mx-auto max-w-4xl px-6 pb-20 lg:px-12">
        {soinCategories.map((category, catIndex) => (
          <div
            key={category.number}
            className="mb-16"
          >
            <div className="mb-8 flex items-baseline gap-4">
              <span className="font-display text-sm text-or-discret">
                {category.number}
              </span>
              <h2 className="font-display text-2xl tracking-wide text-charcoal md:text-3xl">
                {category.title}
              </h2>
            </div>

            <div className="space-y-0">
              {category.items.map((item, i) => (
                <div
                  key={item.name}
                  className={`flex items-start justify-between gap-8 py-6 ${
                    i < category.items.length - 1
                      ? "border-b border-gris-chaud"
                      : ""
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-semibold text-charcoal">
                      {item.name}
                    </h3>
                    <p className="mt-1 font-body text-sm leading-relaxed text-gris-moyen">
                      {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg text-charcoal">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Quote */}
      <section className="bg-rose-light py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
          <blockquote>
            <p className="font-display text-xl italic leading-relaxed text-charcoal md:text-2xl">
              "La beauté est un dialogue intime entre soi et l'artisan. Nous
              sommes simplement le médium de votre expression."
            </p>
            <p className="mt-6 font-heading text-xs font-medium uppercase tracking-[0.2em] text-gris-moyen">
              — L'équipe bayaNail
            </p>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-creme py-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
          <Link to="/reservation" className="btn-premium">
            Réserver un soin
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Tarifs;
