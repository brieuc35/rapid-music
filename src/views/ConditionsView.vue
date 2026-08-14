<template>
  <LegalDoc titre="Conditions d'utilisation">
    <p class="legal__chapo">
      Ce texte décrit ce que {{ SERVICE }} vous propose, ce qu'on attend de vous, et ce que le
      service ne promet pas. Créer un compte vaut acceptation de ces conditions.
    </p>

    <h2>1. Ce qu'est le service</h2>
    <p>
      {{ SERVICE }} est un outil d'organisation pour les artistes : y consigner ses concerts, ses
      sorties, ses contrats, son agenda, ses tâches et ses contacts, et les retrouver sur ses
      appareils. C'est un carnet, pas un intermédiaire : le service ne vend rien pour vous, ne
      vous représente pas et n'intervient dans aucune de vos relations professionnelles.
    </p>

    <h2>2. Le service est gratuit</h2>
    <p>
      À ce jour, {{ SERVICE }} est fourni <b>gratuitement</b> et <b>aucun paiement n'est
      possible</b> : ni carte bancaire, ni prélèvement, ni abonnement facturé.
    </p>
    <p>
      L'onglet « Abonnement » permet d'activer la formule Pro <b>à titre de démonstration</b>,
      sans contrepartie financière, pour voir ce qu'elle contient. Ce n'est pas un achat, et cela
      ne crée aucune obligation de part ni d'autre.
    </p>
    <p>
      Si le service devient payant, cela ne se fera pas en silence : des conditions générales de
      vente devront être publiées et acceptées avant tout paiement, et une formule gratuite
      restera disponible. Aucune donnée déjà enregistrée ne deviendra inaccessible parce qu'une
      offre a changé.
    </p>

    <h2>3. Ce qui est annoncé n'est pas ce qui existe</h2>
    <p>
      Certaines rubriques portent la mention « Bientôt » — l'onglet Réseau, par exemple. Ce sont
      des intentions, pas des engagements : elles peuvent arriver plus tard, autrement, ou pas du
      tout. Rien de ce qui vous est demandé aujourd'hui ne dépend d'elles.
    </p>

    <h2>4. Votre compte</h2>
    <ul>
      <li>
        un compte demande une adresse e-mail valide, dont vous avez l'usage. Confirmez-la :
        sans confirmation, un mot de passe perdu ne peut pas être réinitialisé, et personne ne
        pourra le faire à votre place ;
      </li>
      <li>
        votre mot de passe est le vôtre. L'éditeur ne le connaît pas et ne peut pas le lire. Ne
        le communiquez à personne ;
      </li>
      <li>
        un compte est personnel. Vous êtes responsable de ce qui s'y passe tant qu'il est ouvert
        sur un appareil ;
      </li>
      <li>le service est réservé aux personnes de quinze ans et plus.</li>
    </ul>

    <h2>5. Ce que vous y mettez</h2>
    <p>
      <b>Vos contenus vous appartiennent.</b> L'éditeur ne s'attribue aucun droit sur ce que vous
      saisissez, ne l'exploite pas, ne l'analyse pas et ne le communique à personne.
    </p>
    <p>En contrepartie, vous vous engagez à ne pas utiliser le service :</p>
    <ul>
      <li>pour y consigner des contenus illicites, ou obtenus illicitement ;</li>
      <li>
        pour constituer un fichier de personnes sans nécessité : votre carnet de contacts est un
        carnet professionnel, pas une base de prospection ;
      </li>
      <li>
        pour tenter d'accéder aux données d'un autre compte, de contourner les règles de sécurité,
        ou de perturber le fonctionnement du service ;
      </li>
      <li>d'une manière qui violerait les droits d'un tiers.</li>
    </ul>
    <p>
      Les informations que vous enregistrez au sujet d'autres personnes relèvent de votre
      responsabilité. La
      <RouterLink to="/confidentialite">politique de confidentialité</RouterLink> précise ce que
      cela implique.
    </p>

    <h2>6. Disponibilité, et ses limites</h2>
    <p>
      L'éditeur fait fonctionner le service avec soin, mais ne peut pas garantir qu'il sera
      accessible sans interruption ni sans défaut. Une panne d'hébergeur, une erreur de
      programmation ou une coupure de réseau restent possibles.
    </p>
    <p>
      C'est pourquoi le service vous permet de <b>télécharger une copie complète de vos
      données</b> à tout moment, depuis « Mon profil ». Faites-le régulièrement : c'est la seule
      sauvegarde qui ne dépende de personne d'autre que vous.
    </p>
    <p>
      L'application peut évoluer : des écrans changent, des fonctions apparaissent ou
      disparaissent. Les évolutions qui touchent à vos données sont conçues pour les conserver.
    </p>

    <h2>7. Arrêter</h2>
    <ul>
      <li>
        <b>de votre côté</b> : à tout moment, sans justification et sans frais, en supprimant
        votre compte. La page
        <RouterLink to="/suppression-compte">Supprimer mon compte</RouterLink> explique
        exactement ce qui est effacé ;
      </li>
      <li>
        <b>du côté de l'éditeur</b> : un compte peut être fermé s'il sert manifestement à un
        usage interdit par l'article 5, ou s'il met en péril le service. Sauf abus grave ou
        obligation légale, vous en serez averti par e-mail et pourrez récupérer vos données avant
        la fermeture ;
      </li>
      <li>
        <b>arrêt du service</b> : si {{ SERVICE }} devait cesser, l'annonce serait faite dans
        l'application et par e-mail, avec un délai raisonnable pour exporter vos données.
      </li>
    </ul>

    <h2>8. Responsabilité</h2>
    <p>
      Le service ne remplace ni un conseil juridique, ni un conseil comptable, ni un mandat
      professionnel. Ce que vous y notez au sujet de vos contrats, de vos cachets ou de vos
      royalties n'a que la valeur de vos propres notes : ni preuve, ni document contractuel, ni
      déclaration fiscale.
    </p>
    <p>
      L'éditeur ne peut être tenu responsable des décisions que vous prenez sur la base de ces
      informations, ni d'une perte de données imputable à votre appareil, à votre navigateur ou à
      la suppression de votre propre compte.
    </p>

    <h2>9. Droit applicable</h2>
    <p>
      Ces conditions sont soumises au droit français. En cas de difficulté, écrivez d'abord à
      <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a> : une solution amiable sera recherchée
      avant toute action contentieuse. Le jour où le service devient payant, un médiateur de la
      consommation sera désigné et ses coordonnées figureront ici.
    </p>

    <h2>10. Modifications</h2>
    <p>
      Ces conditions peuvent être modifiées. La date de mise à jour figure en haut de la page, et
      tout changement significatif vous sera signalé dans l'application. Si un changement ne vous
      convient pas, vous pouvez supprimer votre compte, après avoir exporté vos données.
    </p>
  </LegalDoc>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LegalDoc from '@/components/LegalDoc.vue'
import { SERVICE, CONTACT } from '@/legal'
</script>
