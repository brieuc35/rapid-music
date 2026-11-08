<template>
  <LegalDoc titre="Politique de confidentialité">
    <p class="legal__chapo">
      En résumé : {{ SERVICE }} enregistre ce que vous y saisissez pour vous le restituer, et
      rien d'autre. Aucune publicité, aucune mesure d'audience, aucun traceur, aucune revente.
      Vous pouvez à tout moment récupérer une copie de vos données ou supprimer votre compte
      vous-même.
    </p>

    <h2>Qui est responsable</h2>
    <p>
      L'éditeur du service, identifié dans les
      <RouterLink to="/mentions-legales">mentions légales</RouterLink>, est responsable du
      traitement de vos données au sens du règlement général sur la protection des données.
      Pour toute question ou pour exercer vos droits :
      <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a>.
    </p>

    <h2>Ce qui est enregistré</h2>
    <h3>Pour votre compte</h3>
    <ul>
      <li>votre adresse e-mail ;</li>
      <li>
        votre mot de passe, <b>que l'application ne voit jamais</b> : il est confié directement à
        Firebase Authentication, qui n'en conserve qu'une empreinte chiffrée. Ni l'éditeur ni le
        code du site n'y ont accès ;
      </li>
      <li>
        la date de création du compte et celle de la dernière connexion, tenues par Firebase ;
      </li>
      <li>si votre adresse a été confirmée.</li>
    </ul>

    <h3>Ce que vous saisissez</h3>
    <p>
      Tout le contenu des onglets, tel que vous l'écrivez : profil d'artiste (nom de scène, nom
      réel, style, ville, photo, biographie, coordonnées, liens), informations de label,
      concerts, sorties, contrats, royalties, agenda, tâches et contacts. S'y ajoute la date de
      votre dernière modification, qui sert à concilier deux appareils utilisés en parallèle.
    </p>

    <h3>Votre formule</h3>
    <p>
      Si un abonnement est actif sur votre compte, sa formule et ses dates sont enregistrées à
      part, dans un espace que l'application peut lire mais jamais modifier.
    </p>

    <h2>Ce qui n'est pas enregistré</h2>
    <ul>
      <li>aucun cookie publicitaire ni de mesure d'audience — le site n'en dépose aucun ;</li>
      <li>
        aucune statistique de fréquentation : Google Analytics est délibérément absent du site ;
      </li>
      <li>aucun suivi de votre navigation, ici ou ailleurs ;</li>
      <li>aucune donnée bancaire : aucun paiement n'est possible sur le service à ce jour ;</li>
      <li>aucune revente, location ou communication de vos données à des tiers.</li>
    </ul>
    <p>
      Le site utilise en revanche le stockage local de votre navigateur, pour garder votre
      session ouverte et conserver une copie de vos données afin que l'application fonctionne
      sans connexion. C'est un usage strictement technique, nécessaire au service : il ne
      demande pas votre consentement et ne sert à aucun suivi. C'est aussi pourquoi vous ne
      voyez pas de bandeau de cookies.
    </p>

    <h2>À quoi servent ces données</h2>
    <ul>
      <li>
        <b>vous fournir le service</b> : enregistrer vos informations, les retrouver sur vos
        appareils, vous laisser les modifier. Base légale : l'exécution du contrat qui nous lie
        (article 6.1.b du RGPD) ;
      </li>
      <li>
        <b>gérer votre compte</b> : vous connecter, confirmer votre adresse, vous permettre de
        réinitialiser votre mot de passe. Ces messages sont envoyés par Firebase, à votre
        demande. Même base légale ;
      </li>
      <li>
        <b>assurer la sécurité</b> : empêcher qu'un compte accède aux données d'un autre. Intérêt
        légitime (article 6.1.f).
      </li>
    </ul>
    <p>
      Aucune décision automatisée, aucun profilage, aucune prospection. Vous ne recevrez jamais
      de message promotionnel du service.
    </p>

    <h2>Où sont vos données, et qui y touche</h2>
    <p>
      Deux prestataires techniques seulement, tous deux sous-traitants au sens du RGPD :
    </p>
    <ul>
      <li>
        <b>{{ HEBERGEUR_DONNEES.nom }}</b> — comptes et données saisies
        ({{ HEBERGEUR_DONNEES.adresse }}) ;
      </li>
      <li>
        <b>{{ HEBERGEUR_SITE.nom }}</b> — fichiers du site, qui ne contiennent aucune de vos
        données ({{ HEBERGEUR_SITE.adresse }}).
      </li>
    </ul>
    <p>
      Votre base est enregistrée dans une région européenne. Certaines opérations techniques de
      Google — supervision, assistance — peuvent néanmoins impliquer un accès depuis un pays
      hors de l'Union européenne, encadré par les clauses contractuelles types de la Commission
      européenne. L'hébergeur du site est établi aux États-Unis, mais il ne reçoit que les
      fichiers de l'application.
    </p>
    <p>Personne d'autre n'a accès à vos données. L'éditeur ne les consulte pas.</p>

    <h2>Combien de temps</h2>
    <ul>
      <li>
        <b>tant que votre compte existe.</b> Il n'y a pas de suppression automatique après une
        période d'inactivité : personne ne doit perdre son historique parce qu'il n'a pas ouvert
        l'application pendant six mois ;
      </li>
      <li>
        <b>à la suppression du compte, immédiatement</b> : vos données sont effacées, puis le
        compte lui-même. Le détail figure sur la page
        <RouterLink to="/suppression-compte">Supprimer mon compte</RouterLink> ;
      </li>
      <li>
        <b>la copie locale</b> conservée par votre navigateur est effacée dès que vous vous
        déconnectez de cet appareil ;
      </li>
      <li>
        les journaux techniques de nos hébergeurs, qui peuvent contenir votre adresse IP, suivent
        leurs propres durées, de l'ordre de quelques semaines.
      </li>
    </ul>

    <h2>Les informations qui concernent d'autres personnes</h2>
    <p>
      Votre carnet de contacts, vos contrats et vos notes peuvent contenir des informations sur
      d'autres personnes : un manager, un programmateur, un ingénieur du son. Pour ces
      informations-là, <b>c'est vous qui décidez</b>, et donc vous qui en êtes responsable :
      n'y consignez que ce qui vous est utile, tenez-les à jour, et sachez que ces personnes
      peuvent vous demander d'y accéder ou de les effacer. L'éditeur n'en fait aucun usage et
      n'entre jamais en contact avec elles.
    </p>

    <h2>Vos droits</h2>
    <p>Vous pouvez à tout moment :</p>
    <ul>
      <li>
        <b>consulter et corriger</b> vos données — c'est ce que fait l'application, écran par
        écran ;
      </li>
      <li>
        <b>en récupérer une copie</b> dans un fichier réutilisable ailleurs, depuis l'onglet
        « Mon profil ». C'est votre droit à la portabilité, exerçable sans rien demander à
        personne ;
      </li>
      <li>
        <b>tout supprimer</b>, vous-même et sans justification, depuis « Mon profil » également ;
      </li>
      <li>
        <b>vous opposer</b> à un traitement, en demander la limitation, ou nous écrire pour toute
        autre demande : <a :href="`mailto:${CONTACT}`">{{ CONTACT }}</a>. Une réponse vous sera
        apportée dans un délai d'un mois.
      </li>
    </ul>
    <p>
      Si une réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de
      l'informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris
      Cedex 07 — <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>.
    </p>

    <h2>Sécurité</h2>
    <ul>
      <li>tous les échanges passent par une liaison chiffrée (HTTPS) ;</li>
      <li>
        les règles de la base n'autorisent la lecture et l'écriture d'un espace qu'au compte
        auquel il appartient : même en connaissant l'adresse, un autre compte n'y accède pas ;
      </li>
      <li>
        les mots de passe sont gérés par Firebase Authentication, qui n'en garde qu'une empreinte
        chiffrée ;
      </li>
      <li>
        la suppression d'un compte exige de saisir à nouveau le mot de passe, pour qu'un écran
        resté ouvert ne suffise pas.
      </li>
    </ul>
    <p>
      Aucune protection n'est absolue. Confirmez votre adresse e-mail — sans elle, aucun mot de
      passe perdu ne peut être réinitialisé — et gardez une copie de vos données.
    </p>

    <h2>Âge minimum</h2>
    <p>
      Le service n'est pas destiné aux personnes de moins de quinze ans. Un mineur de plus de
      quinze ans peut l'utiliser ; en deçà, l'accord d'un titulaire de l'autorité parentale est
      nécessaire.
    </p>

    <h2>Modifications</h2>
    <p>
      Cette politique peut évoluer avec le service. Sa date de mise à jour figure en haut de
      cette page. Un changement qui vous concerne réellement — un nouveau prestataire, une
      nouvelle finalité — vous sera annoncé dans l'application, et non glissé discrètement dans
      ce texte.
    </p>
  </LegalDoc>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LegalDoc from '@/components/LegalDoc.vue'
import { SERVICE, CONTACT, HEBERGEUR_SITE, HEBERGEUR_DONNEES } from '@/legal'
</script>
