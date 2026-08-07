module.exports = {
  // vue-router 4 utilise l'optional chaining (?.) que Babel n'applique pas
  // aux dépendances par défaut sous vue-cli 4.5 : on l'ajoute à la transpilation.
  transpileDependencies: ['vue-router'],
};
