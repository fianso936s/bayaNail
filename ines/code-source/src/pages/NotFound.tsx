import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-6">
      <div className="text-center">
        <p className="font-display text-8xl text-rose-nude">404</p>
        <h1 className="mt-4 font-display text-2xl text-charcoal">
          Page introuvable
        </h1>
        <p className="mt-3 font-body text-gris-moyen">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn-premium mt-8 inline-block">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
