# 📄 LocalDocx

> **Éditeur de documents Word (.docx) 100% local, privé et hors-ligne pour Android et PC.**  
> Vos fichiers restent exclusivement stockés dans votre téléphone. Zéro cloud, zéro suivi, zéro compte.

🌐 **Application en ligne (PWA) :** [https://grazcata.github.io/localdocx/](https://grazcata.github.io/localdocx/)

---

## ✨ Points forts

* 🔒 **100% Local-First & Privé :** Aucune donnée n'est transmise sur Internet. Tous vos documents sont traités et stockés directement sur votre appareil.
* 📱 **Optimisé pour smartphone Android :** Interface tactile moderne, épurée et réactive avec barre d'outils mobile.
* 📦 **Vrais fichiers .docx :**
  * **Créer** de nouveaux documents Word natifs.
  * **Ouvrir & Éditer** des fichiers `.docx` existants depuis la mémoire de votre téléphone.
  * **Télécharger / Exporter** instantanément en fichier `.docx` standard compatible Microsoft Word, LibreOffice, Google Docs.
* ⚡ **Application PWA installable :** Fonctionne 100% hors-ligne grâce à son Service Worker. Vous pouvez l'ajouter à l'écran d'accueil de votre Android comme une vraie application.
* 💾 **Sauvegarde automatique continue :** Vos modifications sont enregistrées localement en temps réel pour ne jamais perdre votre travail.
* 🌙 **Mode Sombre / Mode Clair :** Basculez à tout moment selon votre confort de lecture.
* 🦀 **Architecture Rust Core :** Contient également un module natif en Rust (`crates/docx-core`) avec `docx-rs` pour les développeurs souhaitant compiler des binaires natifs ou CLI.

---

## 📲 Comment l'installer sur votre téléphone Android

1. Ouvrez le lien sur votre téléphone (Chrome, Firefox ou Brave) :  
   👉 **[https://grazcata.github.io/localdocx/](https://grazcata.github.io/localdocx/)**
2. Appuyez sur le menu du navigateur (les **trois petits points ⋮** en haut à droite).
3. Sélectionnez **« Ajouter à l'écran d'accueil »** ou **« Installer l'application »**.
4. L'icône **LocalDocx** apparaît maintenant parmi vos applications Android. Elle s'ouvre en plein écran et fonctionne même sans aucune connexion Internet !

---

## 🛠️ Fonctionnalités d'édition

* **Formatage de texte :** Titres (H1, H2, H3), texte normal, Gras (**B**), Italique (*I*), Souligné (<u>U</u>), Barré (~~S~~), Surlignage couleur.
* **Mise en page :** Alignement à gauche, centré, aligné à droite, justifié.
* **Listes :** Listes à puces et listes numérotées automatiques.
* **Tableaux :** Insertion et édition de tableaux structurés avec en-têtes.
* **Citations & Séparateurs :** Blocs de citation stylisés et lignes horizontales.
* **Statistiques en direct :** Compteur de mots, nombre de caractères et temps estimé de lecture.
* **Export PDF / Impression :** Préparation du document pour impression directe ou sauvegarde au format PDF.

---

## 🏗️ Structure du Projet

```text
localdocx/
├── index.html                 # Interface principale de l'éditeur
├── style.css                  # Thème responsive mobile-first (clair/sombre)
├── manifest.json              # Déclaration PWA pour installation Android
├── sw.js                      # Service Worker pour cache 100% hors-ligne
├── package.json               # Dépendances Node & scripts de build
├── src/
│   ├── app.js                 # Logique applicative, gestionnaire local & UI
│   ├── docx-converter.js      # Générateur OOXML DOM -> .docx
│   └── vendor.js              # Bundle docx, mammoth et jszip
├── dist/
│   ├── vendor.bundle.js       # Dépendances pré-compilées
│   └── app.bundle.js          # Code applicatif compilé
├── crates/
│   └── docx-core/             # Moteur natif en Rust (docx-rs)
│       ├── Cargo.toml
│       └── src/lib.rs
└── .github/workflows/
    └── deploy.yml             # Déploiement automatique sur GitHub Pages
```

---

## 💻 Développement local

Pour cloner et tester en local sur votre ordinateur :

```bash
# Cloner le dépôt
git clone https://github.com/grazcata/localdocx.git
cd localdocx

# Installer les dépendances
npm install

# Compiler les bundles
npm run build

# Lancer un serveur local
npx serve .
```

---

## 📄 Licence

Ce projet est distribué sous licence libre **MIT**. Vous êtes libre de l'utiliser, le modifier et le distribuer.
