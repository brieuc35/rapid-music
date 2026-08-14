<template>
  <LegalDoc titre="Mentions légales">
    <h2>Éditeur du service</h2>
    <p>
      {{ SERVICE }} ({{ DOMAINE }}) est édité par une personne physique qui n'agit pas à titre
      professionnel. Le service est aujourd'hui fourni gratuitement : aucun paiement ne peut y
      être effectué.
    </p>
    <p>
      Conformément à l'article 6 III 2 de la loi pour la confiance dans l'économie numérique,
      l'éditeur non professionnel peut ne pas rendre publics ses nom et adresse, à condition
      d'avoir communiqué ces informations à son hébergeur, désigné ci-dessous. Elles sont tenues
      à la disposition de toute autorité qui en ferait la demande.
    </p>
    <p>
      Contact : <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a>
    </p>
    <p class="legal__note">
      Ces informations seront complétées par la dénomination, l'adresse et le numéro SIRET dès
      l'immatriculation de l'activité, obligatoire avant toute vente d'abonnement.
    </p>

    <h2>Hébergement</h2>
    <p><b>Les fichiers du site</b> sont hébergés par :</p>
    <p class="legal__bloc">
      {{ HEBERGEUR_SITE.nom }}<br />
      {{ HEBERGEUR_SITE.adresse }}
    </p>
    <p><b>Les comptes et les données saisies</b> sont hébergés par :</p>
    <p class="legal__bloc">
      {{ HEBERGEUR_DONNEES.nom }}<br />
      {{ HEBERGEUR_DONNEES.adresse }}
    </p>
    <p>
      Le détail des données concernées, de leur usage et de leur durée de conservation figure
      dans la <RouterLink to="/confidentialite">politique de confidentialité</RouterLink>.
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      La présentation, les textes et le code du service sont la propriété de l'éditeur. En
      revanche, <b>tout ce que vous saisissez vous appartient</b> : vos concerts, vos sorties,
      vos contrats, vos contacts et vos notes restent les vôtres. L'éditeur ne s'en attribue
      aucun droit, ne les exploite pas et ne les communique à personne.
    </p>
    <p>
      Vous pouvez à tout moment en récupérer une copie complète depuis l'onglet
      « Mon profil », dans un fichier lisible et réutilisable ailleurs.
    </p>

    <h2>Responsabilité</h2>
    <p>
      Le service est un outil d'organisation. Il ne remplace ni un conseil juridique, ni un
      conseil comptable, ni un mandat professionnel : les informations que vous y consignez,
      notamment au sujet de vos contrats et de vos rémunérations, n'ont d'autre valeur que celle
      de vos propres notes.
    </p>
    <p>
      L'éditeur met tout en œuvre pour que le service fonctionne et que vos données soient
      conservées, sans pouvoir garantir une disponibilité ininterrompue. Il vous est recommandé
      de télécharger régulièrement la copie de vos données mentionnée ci-dessus.
    </p>

    <h2>Droit applicable</h2>
    <p>
      Ces mentions sont soumises au droit français. En cas de difficulté, un règlement amiable
      sera recherché avant toute action contentieuse, à l'adresse de contact indiquée plus haut.
    </p>
  </LegalDoc>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LegalDoc from '@/components/LegalDoc.vue'
import { SERVICE, DOMAINE, CONTACT, HEBERGEUR_SITE, HEBERGEUR_DONNEES } from '@/legal'
</script>
