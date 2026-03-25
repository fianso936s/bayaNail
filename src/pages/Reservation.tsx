import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Gift } from "lucide-react";

const services = [
  {
    id: "semi-permanent",
    name: "Pose Semi-Permanent",
    price: 35,
    duration: "45 min",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
    description: "Vernis gel longue tenue, couleurs tendance, finition miroir.",
  },
  {
    id: "gel-extensions",
    name: "Gel Extensions",
    price: 55,
    duration: "1h30",
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&q=80",
    description: "Capsules gel, construction sur-mesure, design personnalisé.",
  },
  {
    id: "manucure",
    name: "Manucure Classique",
    price: 25,
    duration: "30 min",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80",
    description: "Limage, cuticules, vernis classique. Soin express et soigné.",
  },
  {
    id: "nail-art",
    name: "Nail Art Custom",
    price: 65,
    duration: "1h30",
    image:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80",
    description: "French, milky, chrome, 3D — votre design unique sur-mesure.",
  },
];

const artisans = [
  { id: "ines", name: "Inès", specialty: "Nail Art & Gel" },
  { id: "sofia", name: "Sofia", specialty: "Semi-Permanent" },
  { id: "any", name: "Sans préférence", specialty: "Premier disponible" },
];

const timeSlots = [
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

const steps = [
  { number: "01", label: "Service" },
  { number: "02", label: "Artisan" },
  { number: "03", label: "Date & Heure" },
];

const Reservation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedArtisan, setSelectedArtisan] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const service = services.find((s) => s.id === selectedService);

  const canNext = () => {
    if (currentStep === 0) return !!selectedService;
    if (currentStep === 1) return !!selectedArtisan;
    if (currentStep === 2) return !!selectedDate && !!selectedTime && !!name && !!phone;
    return false;
  };

  const handleSubmit = () => {
    alert(
      `Réservation confirmée !\n\nService : ${service?.name}\nDate : ${selectedDate} à ${selectedTime}\nNom : ${name}\nTéléphone : ${phone}`
    );
  };

  return (
    <div className="min-h-screen bg-creme pt-28">
      <div className="mx-auto max-w-7xl px-6 pb-28 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <h1 className="font-display text-charcoal">
            Reserve Your
            <br />
            <span className="italic text-rose-dark">Sanctuary</span>
          </h1>
          <p className="mt-4 max-w-lg font-body text-gris-moyen">
            Sélectionnez votre soin, choisissez votre artisan et réservez
            votre créneau en quelques étapes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Indicators */}
            <div className="mb-10 flex items-center gap-6">
              {steps.map((step, i) => (
                <button
                  key={step.number}
                  onClick={() => i < currentStep && setCurrentStep(i)}
                  className={`flex items-center gap-2 font-heading text-xs uppercase tracking-[0.15em] transition-colors ${
                    i === currentStep
                      ? "text-charcoal"
                      : i < currentStep
                        ? "cursor-pointer text-or-discret"
                        : "text-gris-moyen/50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
                      i < currentStep
                        ? "bg-or-discret text-white"
                        : i === currentStep
                          ? "bg-charcoal text-white"
                          : "bg-gris-chaud text-gris-moyen"
                    }`}
                  >
                    {i < currentStep ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step.number
                    )}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="mb-6 font-display text-xl text-charcoal">
                    Select Service
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedService(s.id)}
                        className={`group overflow-hidden rounded-xl text-left transition-all duration-300 ${
                          selectedService === s.id
                            ? "ring-2 ring-or-discret"
                            : "hover:shadow-elevation-2"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <img
                            src={s.image}
                            srcSet={`${s.image.replace('w=500', 'w=300')} 300w, ${s.image} 500w, ${s.image.replace('w=500', 'w=900')} 900w`}
                            sizes="(max-width: 640px) 100vw, 50vw"
                            alt={s.name}
                            className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement!.style.backgroundColor = "#F5E6E8";
                            }}
                          />
                        </div>
                        <div className="bg-white p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading text-sm font-semibold text-charcoal">
                              {s.name}
                            </h3>
                            <span className="font-display text-sm text-charcoal">
                              {s.price}€
                            </span>
                          </div>
                          <p className="mt-1 font-body text-xs text-gris-moyen">
                            {s.description}
                          </p>
                          <p className="mt-2 font-heading text-[10px] uppercase tracking-widest text-or-discret">
                            {s.duration}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="mb-6 font-display text-xl text-charcoal">
                    Meet Your Artisan
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {artisans.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedArtisan(a.id)}
                        className={`rounded-xl bg-white p-6 text-center transition-all duration-300 ${
                          selectedArtisan === a.id
                            ? "ring-2 ring-or-discret shadow-elevation-2"
                            : "hover:shadow-elevation-1"
                        }`}
                      >
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-light">
                          <span className="font-display text-xl text-rose-dark">
                            {a.name[0]}
                          </span>
                        </div>
                        <h3 className="font-heading text-sm font-semibold text-charcoal">
                          {a.name}
                        </h3>
                        <p className="mt-1 font-body text-xs text-gris-moyen">
                          {a.specialty}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="mb-6 font-display text-xl text-charcoal">
                    Date & Time
                  </h2>

                  {/* Date picker */}
                  <div className="mb-8">
                    <label className="mb-2 block font-heading text-xs uppercase tracking-widest text-gris-moyen">
                      Choisir une date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-lg border-0 bg-white px-4 py-3 font-body text-sm text-charcoal shadow-elevation-1 outline-none focus:ring-2 focus:ring-or-discret/40 sm:w-auto"
                    />
                  </div>

                  {/* Time slots */}
                  <div className="mb-8">
                    <label className="mb-3 block font-heading text-xs uppercase tracking-widest text-gris-moyen">
                      Créneaux disponibles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg px-4 py-2.5 font-body text-sm transition-all ${
                            selectedTime === time
                              ? "bg-charcoal text-white"
                              : "bg-white text-charcoal shadow-elevation-1 hover:bg-rose-light"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block font-heading text-xs uppercase tracking-widest text-gris-moyen">
                        Votre nom
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Prénom Nom"
                        className="w-full rounded-lg border-0 bg-white px-4 py-3 font-body text-sm text-charcoal shadow-elevation-1 outline-none placeholder:text-gris-moyen/50 focus:ring-2 focus:ring-or-discret/40"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-heading text-xs uppercase tracking-widest text-gris-moyen">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 XX XX XX XX"
                        className="w-full rounded-lg border-0 bg-white px-4 py-3 font-body text-sm text-charcoal shadow-elevation-1 outline-none placeholder:text-gris-moyen/50 focus:ring-2 focus:ring-or-discret/40"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 font-heading text-xs uppercase tracking-[0.15em] transition-colors ${
                  currentStep === 0
                    ? "invisible"
                    : "text-gris-moyen hover:text-charcoal"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </button>

              {currentStep < 2 ? (
                <button
                  onClick={() => canNext() && setCurrentStep((s) => s + 1)}
                  disabled={!canNext()}
                  className={`flex items-center gap-2 font-heading text-xs uppercase tracking-[0.15em] transition-colors ${
                    canNext()
                      ? "text-charcoal hover:text-or-discret"
                      : "text-gris-moyen/40"
                  }`}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canNext()}
                  className={`btn-gold ${!canNext() ? "opacity-50" : ""}`}
                >
                  Confirmer la réservation
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Recap */}
          <div className="hidden lg:block">
            <div className="sticky top-28 rounded-xl bg-white p-6 shadow-elevation-2">
              <h3 className="mb-4 font-display text-lg italic text-charcoal">
                Appointment Details
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-heading text-[10px] uppercase tracking-widest text-gris-moyen">
                    Service
                  </p>
                  <p className="mt-1 font-body text-charcoal">
                    {service ? service.name : "Non sélectionné"}
                  </p>
                </div>

                <div>
                  <p className="font-heading text-[10px] uppercase tracking-widest text-gris-moyen">
                    Artisan
                  </p>
                  <p className="mt-1 font-body text-charcoal">
                    {selectedArtisan
                      ? artisans.find((a) => a.id === selectedArtisan)?.name
                      : "Non sélectionné"}
                  </p>
                </div>

                <div>
                  <p className="font-heading text-[10px] uppercase tracking-widest text-gris-moyen">
                    Date
                  </p>
                  <p className="mt-1 font-body text-charcoal">
                    {selectedDate && selectedTime
                      ? `${selectedDate} à ${selectedTime}`
                      : "À planifier"}
                  </p>
                </div>

                <div className="border-t border-gris-chaud pt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-heading text-xs uppercase tracking-widest text-gris-moyen">
                      Total estimé
                    </p>
                    <p className="font-display text-xl text-charcoal">
                      {service ? `${service.price}€` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complimentary card */}
              <div className="mt-6 rounded-lg bg-rose-light p-4">
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-rose-dark" />
                  <div>
                    <p className="font-heading text-xs font-semibold text-charcoal">
                      Complimentary Care
                    </p>
                    <p className="mt-1 font-body text-[11px] leading-relaxed text-gris-moyen">
                      Chaque réservation inclut un soin hydratant des mains
                      offert.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reservation;
