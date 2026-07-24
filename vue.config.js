module.exports = {
  // Vue CLI 4 / webpack 4 n'transpile pas node_modules par défaut. Or les
  // versions récentes de vue-router et du runtime Ionic embarquent du JS moderne
  // (optional chaining « ?. »). On les fait passer par Babel pour que le build
  // aboutisse. À retirer lors de la migration vers Vite (voir docs/plan-produit.md §4.1).
  transpileDependencies: ['vue-router', '@ionic/core', '@ionic/vue', '@ionic/vue-router'],
};
