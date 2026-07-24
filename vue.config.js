module.exports = {
  // Chemin de base. En production, l'app est servie sous /rapid-music/ (site
  // « projet » GitHub Pages : https://brieuc35.github.io/rapid-music/).
  // process.env.BASE_URL en découle et alimente la base du routeur.
  publicPath: process.env.NODE_ENV === 'production' ? '/rapid-music/' : '/',

  // Vue CLI 4 / webpack 4 n'transpile pas node_modules par défaut. Or les
  // versions récentes de vue-router et du runtime Ionic embarquent du JS moderne
  // (optional chaining « ?. »). On les fait passer par Babel pour que le build
  // aboutisse. À retirer lors de la migration vers Vite (voir docs/plan-produit.md §4.1).
  transpileDependencies: ['vue-router', '@ionic/core', '@ionic/vue', '@ionic/vue-router'],
};
