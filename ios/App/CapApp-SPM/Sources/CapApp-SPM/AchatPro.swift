/* -------------------------------------------------------------------------- */
/*  L'achat de l'abonnement Pro sur iPhone                                     */
/*                                                                            */
/*  Le pendant de src/utils/facturation-play.ts, côté Apple. Trois choses      */
/*  seulement : lire les tarifs, déclencher l'achat, retrouver un abonnement   */
/*  déjà pris.                                                                 */
/*                                                                            */
/*  Rien de ce qui est décidé ici ne fait foi. Ce greffon rend un jeton signé  */
/*  par Apple, que la fonction serveur `verifierAchat` fait valider par Apple  */
/*  avant d'ouvrir quoi que ce soit — le navigateur ne peut pas écrire dans    */
/*  `abonnements/{uid}`, les règles de sécurité le lui interdisent. Quelqu'un  */
/*  qui saurait modifier ce fichier ne s'ouvrirait donc aucun accès.           */
/*                                                                            */
/*  Le jeton est la « JWS representation » de la transaction : le reçu d'Apple */
/*  tel qu'Apple l'a signé. On ne le fabrique pas, on le transporte.           */
/*                                                                            */
/*  StoreKit 2, et non l'ancienne interface : elle donne des transactions déjà */
/*  vérifiées par le système, un reçu signé par transaction plutôt qu'un seul  */
/*  reçu global à déchiffrer, et `currentEntitlements`, qui répond exactement  */
/*  à la question qui nous intéresse — cette personne a-t-elle un abonnement   */
/*  en cours. Elle demande iOS 15, que le projet exige déjà.                   */
/* -------------------------------------------------------------------------- */

import Capacitor
import Foundation
import StoreKit

@objc(AchatProPlugin)
public class AchatProPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AchatProPlugin"
    public let jsName = "AchatPro"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "tarifs", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "acheter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "abonnementEnCours", returnType: CAPPluginReturnPromise),
    ]

    /*  Les deux abonnements, tels qu'ils sont créés dans App Store Connect.
     *
     *  Les mêmes identifiants que du côté de Google, et ce n'est pas un hasard :
     *  la fonction serveur compare le produit acheté à une seule liste, quel que
     *  soit le magasin. Deux jeux d'identifiants auraient demandé deux listes,
     *  et un jour l'une des deux aurait été oubliée.
     *
     *  Apple n'a pas la contrainte de Google sur la première offre : ici, deux
     *  produits d'un même groupe d'abonnement se désignent sans ambiguïté. Ils
     *  restent séparés pour que les deux magasins se ressemblent. */
    private static let produits: Set<String> = ["pro_mensuel", "pro_annuel"]

    /*  L'écoute des transactions qui arrivent sans qu'on les ait demandées :
     *  renouvellement mensuel, achat validé par un parent après coup, achat fait
     *  sur un autre appareil du même compte Apple.
     *
     *  Elle sert à une seule chose, mais indispensable : terminer ces
     *  transactions. Une transaction non terminée est resservie par StoreKit à
     *  chaque lancement, indéfiniment. L'accès, lui, ne vient pas d'ici — il est
     *  redemandé au serveur à chaque ouverture de l'application, à partir de
     *  `currentEntitlements`, qui tient déjà compte des renouvellements. */
    private var ecoute: Task<Void, Never>?

    override public func load() {
        ecoute = Task.detached {
            for await resultat in Transaction.updates {
                guard case .verified(let transaction) = resultat else { continue }
                await transaction.finish()
            }
        }
    }

    deinit {
        ecoute?.cancel()
    }

    /* ---------------------------------------------------------------------- */

    /**
     Les prix affichés par l'App Store, dans la monnaie du compte Apple.

     Demandés plutôt qu'écrits dans le code : c'est la panne silencieuse la plus
     probable de tout l'abonnement qu'on évite ainsi — un prix changé dans la
     console et oublié dans l'application, qui annoncerait un montant pendant
     qu'Apple en débiterait un autre.

     Le montant brut accompagne le texte déjà mis en forme, parce que la page
     d'abonnement annonce aussi le tarif annuel ramené au mois : « 99,00 € » ne
     se divise pas.
     */
    @objc func tarifs(_ call: CAPPluginCall) {
        Task {
            do {
                let produits = try await Product.products(for: Self.produits)
                let liste: [[String: Any]] = produits.map { p in
                    [
                        "id": p.id,
                        "montant": NSDecimalNumber(decimal: p.price).doubleValue,
                        "devise": p.priceFormatStyle.currencyCode,
                        "texte": p.displayPrice,
                    ]
                }
                call.resolve(["tarifs": liste])
            } catch {
                /*  Pas un rejet : une panne de réseau ou une fiche encore en
                 *  préparation dans App Store Connect ne doit pas empêcher
                 *  d'afficher la page. L'appelant retombera sur les montants
                 *  écrits dans le code, qui ne servent qu'à présenter l'offre. */
                call.resolve(["tarifs": [], "erreur": String(describing: error)])
            }
        }
    }

    /**
     Déclenche l'achat et rend le reçu signé par Apple.

     Trois issues, toutes normales et distinctes :

     - `jeton`    — c'est payé, le serveur peut vérifier ;
     - `annule`   — la personne a fermé la fenêtre. Ce n'est pas une erreur ;
     - `enAttente` — « Demander à acheter » : un parent doit approuver. Rien
       n'est débité, rien ne s'ouvre, et la transaction arrivera plus tard par
       `Transaction.updates`. L'abonnement s'ouvrira alors au lancement suivant.
     */
    @objc func acheter(_ call: CAPPluginCall) {
        guard let id = call.getString("produit"), Self.produits.contains(id) else {
            call.reject("Produit d'abonnement inconnu.")
            return
        }

        Task {
            do {
                guard let produit = try await Product.products(for: [id]).first else {
                    call.reject("Cet abonnement est introuvable sur l'App Store.")
                    return
                }

                switch try await produit.purchase() {
                case .success(let resultat):
                    /*  Le reçu part signé, quel que soit le verdict local de
                     *  StoreKit : c'est le serveur qui vérifie la signature
                     *  auprès d'Apple, et lui seul ouvre l'accès. Refuser ici un
                     *  reçu `.unverified` ne protégerait rien de plus — le
                     *  serveur le refuserait aussi — et priverait d'un achat
                     *  payé quelqu'un dont l'horloge est à l'heure de la veille.
                     *
                     *  La transaction est terminée tout de suite : ce que nous
                     *  avions à livrer est parti au serveur. Non terminée, elle
                     *  serait resservie à chaque lancement. */
                    if case .verified(let transaction) = resultat {
                        await transaction.finish()
                    }
                    call.resolve(["jeton": resultat.jwsRepresentation])

                case .userCancelled:
                    call.resolve(["annule": true])

                case .pending:
                    call.resolve(["enAttente": true])

                @unknown default:
                    call.reject("L'App Store a répondu quelque chose d'inattendu.")
                }
            } catch {
                call.reject("L'achat n'a pas abouti.", nil, error)
            }
        }
    }

    /**
     Le reçu de l'abonnement en cours, s'il y en a un.

     Sert à deux choses. À chaque lancement, il permet de refaire vérifier
     l'abonnement par le serveur : c'est ce qui le prolonge au renouvellement et
     ce qui le referme après un remboursement. Et il rend son abonnement à
     quelqu'un qui change d'iPhone ou réinstalle l'application, sans qu'il ait à
     repayer — c'est aussi ce qu'Apple exige sous le nom de « restauration des
     achats », et ce qui évite un refus à l'examen.

     `currentEntitlements` ne rend que ce qui est en cours : les abonnements
     expirés ou remboursés n'y figurent pas.
     */
    @objc func abonnementEnCours(_ call: CAPPluginCall) {
        Task {
            for await resultat in Transaction.currentEntitlements {
                guard case .verified(let transaction) = resultat,
                      Self.produits.contains(transaction.productID)
                else { continue }
                call.resolve(["jeton": resultat.jwsRepresentation])
                return
            }
            call.resolve([:])
        }
    }
}
