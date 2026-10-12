<template>
  <LegalDoc titre="Supprimer mon compte">
    <p class="legal__chapo">
      Vous pouvez supprimer votre compte {{ SERVICE }} et toutes vos données vous-même, en deux
      minutes, sans rien demander à personne et sans donner de raison.
    </p>

    <h2>Avant de commencer : gardez une copie</h2>
    <p>
      La suppression est <b>immédiate et définitive</b>. Rien ne peut être restauré ensuite, ni
      par vous ni par l'éditeur. Si vos concerts, vos contrats ou vos contacts peuvent vous
      resservir un jour, téléchargez-les d'abord : onglet <b>Mon profil</b>, bouton
      <b>Exporter mes données</b>. Vous obtenez un fichier que vous pourrez réimporter plus tard.
    </p>

    <h2>Depuis l'application</h2>
    <ol>
      <li>ouvrez l'onglet <b>Mon profil</b> ;</li>
      <li>descendez jusqu'à <b>Supprimer mon compte</b> ;</li>
      <li>
        saisissez votre mot de passe — il est redemandé pour qu'un écran resté ouvert ne suffise
        pas à effacer un compte ;
      </li>
      <li>confirmez.</li>
    </ol>

    <h2>Si vous n'avez plus accès à l'application</h2>
    <p>
      Écrivez à <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a> depuis l'adresse e-mail du
      compte. La demande sera traitée dans un délai maximum de
      {{ DELAI_SUPPRESSION_MANUELLE }}. Si le message vient d'une autre adresse, une
      vérification sera nécessaire : c'est la seule chose qui empêche quelqu'un de faire
      supprimer votre compte à votre place.
    </p>

    <h2>Ce qui est supprimé</h2>
    <p>Dans cet ordre, et immédiatement :</p>
    <ol>
      <li>
        <b>toutes vos données</b> : profil d'artiste et photo, label, concerts, sorties,
        contrats, royalties, agenda, tâches, contacts et notes ;
      </li>
      <li>
        <b>la copie locale</b> conservée par le navigateur de l'appareil que vous utilisez ;
      </li>
      <li><b>le compte lui-même</b> : votre adresse e-mail et votre mot de passe.</li>
      <li>
        <b>ce que le compte laissait derrière lui</b> : votre formule d'abonnement, le
        rattachement de votre achat et la trace des messages automatiques que vous avez reçus,
        qui portait votre adresse. Ces trois-là sont enregistrés dans des espaces que
        l'application n'a pas le droit de modifier — c'est ce qui empêche qu'un abonnement
        s'active depuis un navigateur — et c'est donc le serveur qui les efface, dans la
        seconde qui suit la suppression du compte.
      </li>
    </ol>
    <p>
      Cet ordre est volontaire. Si l'effacement des données échouait — une coupure de réseau au
      mauvais moment —, <b>le compte est conservé</b> et un message vous invite à réessayer. Il
      ne peut donc pas rester un compte sans données, ni des données sans compte.
    </p>

    <h2>Votre abonnement Pro</h2>
    <p>
      Si vous êtes abonné, il faut distinguer deux choses : votre compte {{ SERVICE }}, qui est
      chez nous, et votre abonnement, qui est chez le magasin où vous l'avez pris. Supprimer le
      premier n'efface pas le second, et <b>un abonnement non résilié continue d'être prélevé</b>
      même sans compte pour en profiter.
    </p>
    <ul>
      <li>
        <b>Sur Google Play</b>, nous demandons la résiliation au moment de la suppression : la
        reconduction s'arrête, et la période déjà réglée court jusqu'à son terme.
      </li>
      <li>
        <b>Sur l'App Store</b>, aucune application n'a le droit de résilier ce qu'Apple encaisse —
        seul le titulaire du compte Apple peut le faire. <b>Résiliez avant de supprimer</b>, dans
        « Abonnements » des réglages de votre compte Apple. La fenêtre de suppression vous le
        rappelle et vous y conduit d'un geste.
      </li>
    </ul>
    <p>
      Dans les deux cas, l'accès aux fonctions Pro cesse avec le compte, immédiatement. Et si vous
      recréez un compte alors que l'abonnement court encore, il lui sera rendu : l'abonnement
      revient au dernier compte qui le présente.
    </p>

    <h2>Ce qui peut subsister, et combien de temps</h2>
    <ul>
      <li>
        <b>votre abonnement chez le magasin</b>, s'il n'a pas été résilié — voir ci-dessus. Il
        n'est pas entre nos mains, et nous ne pouvons ni le voir ni l'arrêter après la suppression
        de votre compte ;
      </li>
      <li>
        <b>les journaux techniques</b> de nos hébergeurs, qui peuvent contenir une adresse IP et
        une date de connexion, selon leurs propres durées — de l'ordre de quelques semaines ;
      </li>
      <li>
        <b>les données des versions sans compte</b> : si vous utilisiez {{ SERVICE }} avant que
        les comptes existent, une trace peut demeurer dans le stockage de ce navigateur. Elle
        n'est reliée à aucun compte et ne quitte pas votre appareil ; videz les données du site
        dans les réglages de votre navigateur pour l'effacer ;
      </li>
      <li>
        <b>les copies que vous avez faites vous-même</b> : un fichier exporté reste sur votre
        appareil, personne d'autre ne peut y accéder.
      </li>
    </ul>

    <h2>Et ensuite</h2>
    <p>
      Rien ne vous empêche de recréer un compte plus tard avec la même adresse : il repartira
      vierge. Si vous avez conservé un fichier d'export, vous pourrez y réimporter tout votre
      historique.
    </p>
    <p>
      Pour le détail de ce qui est enregistré et pourquoi, voyez la
      <RouterLink to="/confidentialite">politique de confidentialité</RouterLink>.
    </p>
  </LegalDoc>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LegalDoc from '@/components/LegalDoc.vue'
import { SERVICE, CONTACT, DELAI_SUPPRESSION_MANUELLE } from '@/legal'
</script>
