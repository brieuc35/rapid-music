/* -------------------------------------------------------------------------- */
/*  Déclare les greffons natifs écrits à la main                               */
/*                                                                            */
/*    node scripts/greffons-ios.mjs        (après « npx cap sync ios »)        */
/*                                                                            */
/*  À lancer après `cap sync`, jamais avant : `sync` réécrit le fichier que    */
/*  ce script corrige, et l'ordre inverse ne laisserait aucune trace.          */
/*                                                                            */
/*  Pourquoi ce script existe                                                  */
/*  ------------------------                                                  */
/*                                                                            */
/*  Compiler un greffon ne l'enregistre pas. Ce sont deux étapes distinctes,   */
/*  et rien ne signale que la seconde manque : l'application se fabrique, se   */
/*  signe et s'envoie sans une seule alerte — c'est à l'exécution, sur un      */
/*  téléphone, que `window.Capacitor.Plugins.AchatPro` se révèle absent et que */
/*  l'écran d'abonnement affiche « Indisponible pour le moment ».              */
/*                                                                            */
/*  Côté iOS, Capacitor n'explore pas le code à la recherche de greffons. Il   */
/*  lit une liste, `packageClassList`, dans `ios/App/App/capacitor.config.json`*/
/*  — voir `registerPlugins()` dans CapacitorBridge.swift — et n'instancie que */
/*  ce qu'elle nomme. Or `cap sync` construit cette liste à partir des seuls   */
/*  paquets npm qui se déclarent greffons Capacitor. Un fichier Swift déposé   */
/*  dans `CapApp-SPM/Sources/` est compilé, lié, et ignoré.                    */
/*                                                                            */
/*  Vérifié plutôt que supposé : `npx cap copy ios` a été lancé avec, puis     */
/*  sans, une entrée `packageClassList` dans `capacitor.config.ts`. Les deux   */
/*  fois, le fichier produit portait une liste vide — la valeur écrite dans la */
/*  configuration est écrasée, elle ne sert donc à rien.                       */
/*                                                                            */
/*  L'autre voie serait d'empaqueter le greffon comme un module npm local,     */
/*  avec son propre Package.swift. C'est la manière prévue par Capacitor, et   */
/*  elle vaudra le détour au troisième greffon. Pour un seul fichier, elle     */
/*  ajoute un paquet, un manifeste et une dépendance là où il suffit de nommer */
/*  une classe.                                                               */
/* -------------------------------------------------------------------------- */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG = join(RACINE, 'ios', 'App', 'App', 'capacitor.config.json')

/*  Le nom exposé à l'Objective-C, celui du `@objc(...)` en tête de la classe —
 *  et non le nom Swift, que `NSClassFromString` ne trouverait pas.
 *
 *  Le « jsName » du greffon, lui, est « AchatPro » : c'est sous ce nom-là qu'il
 *  apparaît dans `window.Capacitor.Plugins`. Les deux diffèrent volontairement,
 *  et les confondre donne un greffon enregistré qui ne répond à personne. */
const GREFFONS = ['AchatProPlugin']

/*  Le fichier source du greffon, relevé pour que le contrôle porte sur ce qui
 *  existe vraiment : une classe renommée d'un côté sans l'autre casserait
 *  l'enregistrement en silence, et c'est exactement le genre de panne que ce
 *  script est né pour empêcher. */
const SOURCE = join(RACINE, 'ios', 'App', 'CapApp-SPM', 'Sources', 'CapApp-SPM', 'AchatPro.swift')

function principal() {
  let config
  try {
    config = JSON.parse(readFileSync(CONFIG, 'utf8'))
  } catch {
    throw new Error(
      `${CONFIG} est introuvable ou illisible.\n` +
        'Ce script se lance après « npx cap sync ios », qui le produit.',
    )
  }

  const swift = readFileSync(SOURCE, 'utf8')
  for (const nom of GREFFONS) {
    if (!swift.includes(`@objc(${nom})`)) {
      throw new Error(
        `La classe « ${nom} » n'est déclarée nulle part dans ${SOURCE}.\n` +
          "Le nom attendu est celui du « @objc(...) », et c'est lui qu'iOS cherche.",
      )
    }
  }

  const avant = config.packageClassList ?? []
  const apres = [...new Set([...avant, ...GREFFONS])]
  config.packageClassList = apres

  writeFileSync(CONFIG, `${JSON.stringify(config, null, '\t')}\n`)

  const ajoutes = apres.filter((n) => !avant.includes(n))
  console.log(
    ajoutes.length
      ? `Greffons déclarés : ${ajoutes.join(', ')}`
      : 'Greffons déjà déclarés, rien à faire.',
  )
  console.log(`packageClassList = [${apres.join(', ')}]`)
}

principal()
