<template>
  <!-- Note de musique traversée d'un éclair : la rapidité de « Rapid ».

       La note est fine, l'éclair est gras : c'est cet écart qui donne à
       l'éclair son mordant. À épaisseurs égales, les deux se confondaient en
       une seule masse.

       L'éclair est plein, et dilaté par un contour de sa propre couleur —
       le seul moyen de le grossir sans le redessiner. `miter` garde ses
       pointes vives, là où le `round` du groupe les arrondirait.

       Le dessin est celui de scripts/marque.mjs, recopié parce qu'un composant
       Vue ne peut pas importer un module que Node exécute. Les deux doivent
       rester identiques : ce fichier-ci sert dans l'application, celui-là dans
       toutes les icônes. -->
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 16.5V5l8-1.5" stroke-width="1.8" />
    <circle cx="6" cy="16.5" r="2.6" stroke-width="1.8" />
    <path
      d="M18.4 6.2 13.6 12.9h3.6L14.4 19.8 20.8 11.4h-3.8z"
      fill="#fff"
      stroke="#fff"
      stroke-width="0.6"
      stroke-linejoin="miter"
    />
  </svg>
</template>
