import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageBreak,
} from "docx";
import * as fs from "fs";

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        // ====== PAGE DE GARDE ======
        new Paragraph({ spacing: { after: 600 }, children: [] }),
        new Paragraph({ spacing: { after: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "bayaNail",
              bold: true,
              font: "Georgia",
              size: 72,
              color: "D4A0A0",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Bar à Ongles — Aubervilliers",
              font: "Calibri",
              size: 28,
              color: "7A7A7A",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: "C9A96E",
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "DOCUMENT DE LIVRAISON & AUDIT",
              bold: true,
              font: "Calibri",
              size: 36,
              color: "2C2C2C",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Maquette du site vitrine — Version 1.0",
              font: "Calibri",
              size: 24,
              color: "7A7A7A",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [
            new TextRun({
              text: "Préparé pour : Madame Inès",
              font: "Calibri",
              size: 24,
              color: "2C2C2C",
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Date : ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
              font: "Calibri",
              size: 22,
              color: "7A7A7A",
            }),
          ],
        }),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== SOMMAIRE ======
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "Sommaire", bold: true, color: "2C2C2C", size: 36, font: "Georgia" }),
          ],
        }),
        ...[
          "1. Présentation du projet",
          "2. Pages du site",
          "3. Design & Identité visuelle",
          "4. Identifiants de connexion",
          "5. Audit technique — Points à corriger",
          "6. Recommandations prioritaires",
          "7. Code source",
        ].map(
          (item) =>
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({ text: item, size: 24, color: "2C2C2C" }),
              ],
            })
        ),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 1. PRESENTATION ======
        sectionTitle("1. Présentation du projet"),
        para("bayaNail est un site vitrine pour un bar à ongles situé à Aubervilliers. Le site est actuellement une MAQUETTE fonctionnelle, c'est-à-dire que le design, les pages et les interactions sont en place, mais certaines fonctionnalités back-end ne sont pas encore connectées."),
        para(""),
        subTitle("Stack technique"),
        bulletPoint("Frontend : React 18 + TypeScript + Vite"),
        bulletPoint("Style : Tailwind CSS 3.4 avec design system personnalisé"),
        bulletPoint("Animations : Framer Motion (parallax, transitions)"),
        bulletPoint("Hébergement : Vercel (déploiement automatique via GitHub)"),
        bulletPoint("Images : Unsplash (images temporaires de démonstration)"),
        para(""),

        subTitle("URL du site"),
        para("Le site est déployé automatiquement sur Vercel à chaque push sur la branche main."),
        para("L'URL de production sera communiquée séparément. Vérifiez le dashboard Vercel pour l'URL exacte."),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 2. PAGES DU SITE ======
        sectionTitle("2. Pages du site"),
        para("Le site comporte 5 pages accessibles via la navigation :"),
        para(""),

        subTitle("Page d'accueil ( / )"),
        bulletPoint("Hero en plein écran avec effet parallax"),
        bulletPoint("Section « Curated Services » — 3 prestations phares avec images"),
        bulletPoint("Section « Testimonials » — 3 avis clients"),
        bulletPoint("Call-to-action final avec fond sombre"),
        para(""),

        subTitle("Galerie ( /galerie )"),
        bulletPoint("Grille de 10 images avec effet masonry"),
        bulletPoint("Filtre par catégorie : Tout, French, Milky, Chrome, Nail Art, Natural"),
        bulletPoint("Animations de transition entre les filtres"),
        bulletPoint("Effet parallax et hover sur chaque image"),
        para(""),

        subTitle("Menu des Soins ( /soins )"),
        bulletPoint("3 catégories : Classic Care, Advanced Techniques, Wellness Rituals"),
        bulletPoint("Tarifs détaillés pour chaque prestation"),
        bulletPoint("Image signature en header"),
        bulletPoint("Citation d'équipe en bas de page"),
        para(""),

        subTitle("Réservation ( /reservation )"),
        bulletPoint("Formulaire en 3 étapes : Service → Artisan → Date & Heure"),
        bulletPoint("Récapitulatif en sidebar (desktop)"),
        bulletPoint("⚠️ MAQUETTE UNIQUEMENT : le formulaire affiche une alerte, il n'envoie pas de vraie réservation"),
        para(""),

        subTitle("Page 404"),
        bulletPoint("Page d'erreur élégante avec lien retour à l'accueil"),
        para(""),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 3. DESIGN ======
        sectionTitle("3. Design & Identité visuelle"),
        para("Le design du site suit une charte graphique haut de gamme et minimaliste :"),
        para(""),

        subTitle("Palette de couleurs"),
        colorRow("Rose Nude (Primary)", "#D4A0A0"),
        colorRow("Rose Foncé (Hover)", "#B87878"),
        colorRow("Charcoal (Texte)", "#2C2C2C"),
        colorRow("Or Discret (Accent)", "#C9A96E"),
        colorRow("Crème (Fond)", "#FDF8F5"),
        colorRow("Gris Chaud (Fond section)", "#F0EDE9"),
        colorRow("Rose Light", "#F5E6E8"),
        colorRow("Gris Moyen (Texte secondaire)", "#7A7A7A"),
        para(""),

        subTitle("Typographies (Google Fonts)"),
        bulletPoint("Playfair Display — Titres principaux (serif, élégant)"),
        bulletPoint("Montserrat — Labels, boutons, navigation (sans-serif)"),
        bulletPoint("Lato — Corps de texte (sans-serif, lisible)"),
        para(""),

        subTitle("Composants UI"),
        bulletPoint("btn-premium : bouton principal rose foncé avec hover lift"),
        bulletPoint("btn-ghost : bouton outline transparent"),
        bulletPoint("btn-gold : bouton accent doré"),
        bulletPoint("card-editorial : carte blanche avec ombre et hover"),
        bulletPoint("glass : effet glassmorphism (flou d'arrière-plan)"),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 4. IDENTIFIANTS ======
        sectionTitle("4. Identifiants de connexion"),
        para(""),

        subTitle("Hébergement — Vercel"),
        bulletPoint("Connexion via compte GitHub : github.com/fianso936s"),
        bulletPoint("Projet : bayaNail (déploiement automatique)"),
        bulletPoint("Dashboard : vercel.com → se connecter avec GitHub"),
        para(""),

        subTitle("Dépôt de code — GitHub"),
        bulletPoint("URL : github.com/fianso936s/bayaNail"),
        bulletPoint("Branche principale : main"),
        bulletPoint("Accès : via le compte GitHub du propriétaire"),
        para(""),

        subTitle("Base de données (développement local)"),
        para("Ces identifiants sont pour le développement local uniquement (Docker MySQL) :"),
        bulletPoint("Base de données : bayanail_db"),
        bulletPoint("Utilisateur : user"),
        bulletPoint("Mot de passe : password"),
        bulletPoint("Mot de passe root : rootpassword"),
        bulletPoint("Port : 3306"),
        para(""),

        subTitle("Comptes de test (API back-end)"),
        para("Mot de passe unique pour tous les comptes de test : lounes92"),
        para(""),
        bulletPoint("Admin : admin@bayanail.com — lounes92"),
        bulletPoint("Moniteur 1 : jean.moniteur@bayanail.fr — lounes92"),
        bulletPoint("Moniteur 2 : marie.monitrice@bayanail.fr — lounes92"),
        bulletPoint("Élèves : student1@bayanail.fr à student10@bayanail.fr — lounes92"),
        para(""),

        warnBox("⚠️ IMPORTANT : En production, il faut changer TOUS les mots de passe par des mots de passe sécurisés et uniques."),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 5. AUDIT ======
        sectionTitle("5. Audit technique — Points à corriger"),
        para(""),

        // CRITIQUE
        subTitle("🔴 CRITIQUE"),
        para(""),

        issueCard(
          "5.1 — Réservation non fonctionnelle",
          "CRITIQUE",
          "Le formulaire de réservation (/reservation) affiche une simple alerte JavaScript au lieu d'envoyer les données à un serveur. Aucune réservation n'est enregistrée.",
          "Connecter le formulaire à une API back-end (ou un service comme Cal.com, Calendly, ou une Google Sheet via webhook)."
        ),

        issueCard(
          "5.2 — Images temporaires (Unsplash)",
          "HAUTE",
          "Toutes les images du site proviennent d'Unsplash (images génériques de manucure). Elles ne représentent pas le vrai salon.",
          "Remplacer par des photos professionnelles du salon bayaNail, des réalisations réelles et de l'équipe."
        ),

        issueCard(
          "5.3 — Lien Instagram générique",
          "HAUTE",
          "Le lien Instagram dans le footer pointe vers instagram.com (la page d'accueil) au lieu du profil @bayanail.",
          "Mettre à jour le lien avec l'URL du profil Instagram réel du salon."
        ),

        issueCard(
          "5.4 — Dépendances inutilisées",
          "MOYENNE",
          "Le projet inclut des librairies non utilisées (FullCalendar, Leaflet, Recharts, Socket.io) qui alourdissent le bundle de ~200KB+.",
          "Supprimer les dépendances inutilisées avec npm uninstall."
        ),

        para(""),
        subTitle("🟡 AMÉLIORATIONS SEO"),
        para(""),

        issueCard(
          "5.5 — Meta tags manquants",
          "MOYENNE",
          "Pas de balises Open Graph (og:image, og:title), pas de Twitter Card, pas de balise canonical, pas de données structurées (JSON-LD pour commerce local).",
          "Ajouter les meta tags dans index.html et/ou utiliser react-helmet-async."
        ),

        issueCard(
          "5.6 — Pas de sitemap.xml ni robots.txt",
          "MOYENNE",
          "Aucun fichier sitemap.xml ou robots.txt n'est présent, ce qui limite le référencement sur Google.",
          "Créer ces fichiers dans le dossier public/."
        ),

        issueCard(
          "5.7 — Titre de page identique sur toutes les pages",
          "BASSE",
          "Toutes les pages affichent le même titre dans l'onglet du navigateur : « bayaNail | Bar à Ongles ».",
          "Ajouter un titre dynamique par page (ex: « Galerie — bayaNail », « Nos Soins — bayaNail »)."
        ),

        para(""),
        subTitle("🟢 AMÉLIORATIONS MINEURES"),
        para(""),

        issueCard(
          "5.8 — Validation du formulaire de réservation",
          "BASSE",
          "Le formulaire accepte n'importe quelle valeur pour le téléphone et le nom, sans validation.",
          "Ajouter une validation côté client (format téléphone français, nom non vide)."
        ),

        issueCard(
          "5.9 — Lien <a> au lieu de <Link> dans la galerie",
          "BASSE",
          "Le bouton « Réserver maintenant » dans la galerie utilise <a href> au lieu de React Router <Link>, ce qui provoque un rechargement complet de la page.",
          "Remplacer par un composant <Link to=\"/reservation\">."
        ),

        issueCard(
          "5.10 — Accessibilité formulaire multi-étapes",
          "BASSE",
          "Le changement d'étape dans le formulaire de réservation n'est pas annoncé aux lecteurs d'écran (pas d'aria-live).",
          "Ajouter des attributs aria-live et des labels ARIA pour les changements dynamiques."
        ),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 6. RECOMMANDATIONS ======
        sectionTitle("6. Recommandations prioritaires"),
        para("Voici les actions à mener par ordre de priorité pour passer de la maquette à un site de production :"),
        para(""),

        new Table({
          rows: [
            tableHeaderRow(["#", "Action", "Priorité", "Effort"]),
            tableDataRow(["1", "Remplacer les photos Unsplash par les vraies photos du salon", "🔴 Haute", "Moyen"]),
            tableDataRow(["2", "Connecter le formulaire de réservation à un back-end", "🔴 Haute", "Élevé"]),
            tableDataRow(["3", "Mettre le vrai lien Instagram du salon", "🔴 Haute", "5 min"]),
            tableDataRow(["4", "Ajouter les meta tags SEO (Open Graph, etc.)", "🟡 Moyenne", "1h"]),
            tableDataRow(["5", "Créer sitemap.xml et robots.txt", "🟡 Moyenne", "30 min"]),
            tableDataRow(["6", "Supprimer les dépendances npm inutilisées", "🟡 Moyenne", "15 min"]),
            tableDataRow(["7", "Ajouter un titre de page dynamique par route", "🟢 Basse", "30 min"]),
            tableDataRow(["8", "Validation du formulaire (téléphone, nom)", "🟢 Basse", "1h"]),
            tableDataRow(["9", "Changer les mots de passe par défaut pour la production", "🔴 Haute", "15 min"]),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // ====== PAGE BREAK ======
        new Paragraph({ children: [new PageBreak()] }),

        // ====== 7. CODE SOURCE ======
        sectionTitle("7. Code source"),
        para("Une copie complète du code source est fournie dans le dossier accompagnant ce document :"),
        para(""),
        bulletPoint("📁 ines/code-source/ — Contient tous les fichiers du projet"),
        bulletPoint("📄 ines/AUDIT-BAYANAIL.docx — Ce document"),
        para(""),

        subTitle("Structure du projet"),
        codeLine("src/"),
        codeLine("  ├── components/        → Composants réutilisables (Navbar, Footer, UI)"),
        codeLine("  ├── pages/             → Pages du site (Home, Galerie, Tarifs, Reservation)"),
        codeLine("  ├── layouts/           → Layout principal (PublicLayout)"),
        codeLine("  ├── styles/            → CSS global + design tokens Tailwind"),
        codeLine("  ├── lib/               → Utilitaires"),
        codeLine("  ├── App.tsx            → Routeur React"),
        codeLine("  └── main.tsx           → Point d'entrée"),
        codeLine(""),
        codeLine("tailwind.config.js       → Design system (couleurs, fonts, ombres)"),
        codeLine("vite.config.ts           → Configuration du build"),
        codeLine("package.json             → Dépendances"),
        para(""),

        subTitle("Commandes utiles"),
        codeLine("npm install              → Installer les dépendances"),
        codeLine("npm run dev              → Lancer le serveur de développement"),
        codeLine("npm run build            → Compiler pour la production"),
        codeLine("npm run preview          → Prévisualiser le build"),
        para(""),
        para(""),

        // ====== FOOTER ======
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: "C9A96E",
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Document généré automatiquement — bayaNail © 2026",
              size: 18,
              color: "7A7A7A",
              italics: true,
            }),
          ],
        }),
      ],
    },
  ],
});

// ====== HELPER FUNCTIONS ======

function sectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: {
      bottom: { color: "C9A96E", style: BorderStyle.SINGLE, size: 6, space: 8 },
    },
    children: [
      new TextRun({ text, bold: true, color: "2C2C2C", size: 32, font: "Georgia" }),
    ],
  });
}

function subTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text, bold: true, color: "2C2C2C", size: 26, font: "Calibri" }),
    ],
  });
}

function para(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text, size: 22, color: "2C2C2C" }),
    ],
  });
}

function bulletPoint(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 400 },
    children: [
      new TextRun({ text: "•  ", size: 22, color: "C9A96E" }),
      new TextRun({ text, size: 22, color: "2C2C2C" }),
    ],
  });
}

function colorRow(name, hex) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 400 },
    children: [
      new TextRun({ text: `■ ${hex}`, size: 22, color: hex.replace("#", ""), bold: true }),
      new TextRun({ text: `  —  ${name}`, size: 22, color: "2C2C2C" }),
    ],
  });
}

function codeLine(text) {
  return new Paragraph({
    spacing: { after: 20 },
    indent: { left: 400 },
    children: [
      new TextRun({ text, size: 20, font: "Consolas", color: "555555" }),
    ],
  });
}

function warnBox(text) {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    shading: { type: ShadingType.SOLID, fill: "FFF3CD" },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text, size: 22, bold: true, color: "856404" }),
    ],
  });
}

function issueCard(title, severity, description, fix) {
  const severityColor = severity === "CRITIQUE" ? "DC3545" : severity === "HAUTE" ? "FD7E14" : severity === "MOYENNE" ? "FFC107" : "28A745";
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, fill: "F8F9FA" },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: `[${severity}] `, bold: true, color: severityColor, size: 22 }),
                  new TextRun({ text: title, bold: true, color: "2C2C2C", size: 24 }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: "Problème : ", bold: true, size: 20, color: "555555" }),
                  new TextRun({ text: description, size: 20, color: "555555" }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "✅ Correction : ", bold: true, size: 20, color: "28A745" }),
                  new TextRun({ text: fix, size: 20, color: "2C2C2C" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function tableHeaderRow(cells) {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: "2C2C2C" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20 })],
            }),
          ],
        })
    ),
  });
}

function tableDataRow(cells) {
  return new TableRow({
    children: cells.map(
      (text, i) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, fill: i % 2 === 0 ? "F8F9FA" : "FFFFFF" },
          children: [
            new Paragraph({
              children: [new TextRun({ text, size: 20, color: "2C2C2C" })],
            }),
          ],
        })
    ),
  });
}

// ====== GENERATE FILE ======
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("/home/user/bayaNail/ines/AUDIT-BAYANAIL.docx", buffer);
console.log("✅ Document Word généré : ines/AUDIT-BAYANAIL.docx");
