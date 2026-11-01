<template>
  <div class="page">
    <PageHeader
      title="Assistant"
      subtitle="Un spécialiste du métier, qui connaît votre dossier."
    />

    <ProGate
      title="Posez vos questions de métier"
      lead="Contrats, royalties, booking, promotion, droits : l'assistant répond en tenant compte de vos dates, de vos contrats et de vos revenus réels."
      :features="[
        'Il connaît votre dossier : vos concerts, contrats, sorties et revenus',
        'Spécialisé sur le métier français — SACEM, SPPF, intermittence, CNM',
        'Les points de vigilance avant de signer, et les questions à poser',
        `${LIMITE} questions par mois, remises à zéro le 1er`,
      ]"
    >
      <div class="chat">
        <!--  L'écran d'accueil : trois questions à toucher du doigt.

              Une zone de saisie vide devant quelqu'un qui découvre l'outil est
              la façon la plus sûre de ne jamais le faire essayer. Les exemples
              montrent ce qu'on peut demander — et ils sont fabriqués à partir
              du dossier réel, pour que la première réponse porte déjà sur
              quelque chose qui le concerne. -->
        <div v-if="!tours.length" class="accueil">
          <span class="accueil__ico"><Icon name="spark" /></span>
          <h2 class="accueil__titre">Que voulez-vous savoir ?</h2>
          <p class="accueil__lead">
            L'assistant a lu votre dossier. Posez une question, ou partez de l'une de
            celles-ci.
          </p>
          <div class="accueil__exemples">
            <button
              v-for="ex in exemples"
              :key="ex"
              class="exemple"
              :disabled="enCours"
              @click="envoyer(ex)"
            >
              {{ ex }}
            </button>
          </div>
        </div>

        <!--  La conversation. `ref` sur le dernier message plutôt que sur le
              conteneur : c'est lui qu'on veut amener à l'écran. -->
        <div v-else ref="fil" class="fil">
          <div v-for="(t, i) in tours" :key="i" class="tour" :class="`tour--${t.role}`">
            <div v-if="t.role === 'assistant'" class="tour__ico"><Icon name="spark" /></div>
            <!--  v-html, et c'est délibéré : `enHtml` échappe tout avant de
                  traduire quoi que ce soit, et ne produit que des paragraphes,
                  des listes et du gras. Voir utils/assistant-texte.ts. -->
            <div v-if="t.role === 'assistant'" class="tour__texte" v-html="enHtml(t.content)"></div>
            <div v-else class="tour__texte">{{ t.content }}</div>
          </div>

          <div v-if="enCours" class="tour tour--assistant">
            <div class="tour__ico"><Icon name="spark" /></div>
            <div class="tour__texte reflexion">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <p v-if="erreur" class="alert-err">{{ erreur }}</p>

        <!--  La saisie. Un formulaire, pour que la touche Entrée fonctionne
              sans qu'on ait à l'intercepter. -->
        <form class="saisie" @submit.prevent="envoyer()">
          <textarea
            ref="champ"
            v-model="question"
            class="saisie__champ"
            rows="1"
            :disabled="enCours || epuise"
            :placeholder="epuise ? 'Quota du mois atteint' : 'Posez votre question…'"
            @input="ajusterHauteur"
            @keydown.enter.exact.prevent="envoyer()"
          ></textarea>
          <button
            class="btn btn--primary saisie__envoi"
            type="submit"
            :disabled="!question.trim() || enCours || epuise"
            aria-label="Envoyer"
          >
            <Icon :name="enCours ? 'clock' : 'up'" />
          </button>
        </form>

        <div class="pied">
          <span v-if="restantes !== null">
            {{ restantes }} question{{ restantes > 1 ? 's' : '' }} ce mois-ci
          </span>
          <span v-else>{{ LIMITE }} questions par mois</span>
          <button v-if="tours.length" class="pied__vider" @click="vider">
            Nouvelle conversation
          </button>
        </div>

        <p class="avertissement">
          L'assistant éclaire une décision, il ne la prend pas. Sur un contrat ou une
          question fiscale, faites relire par un professionnel avant de signer.
        </p>
      </div>
    </ProGate>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ProGate from '@/components/ProGate.vue'
import Icon from '@/components/Icon.vue'
import { store } from '@/store'
import { demander, ErreurAssistant, type Tour } from '@/utils/assistant'
import { enHtml } from '@/utils/assistant-texte'

/*  Doit correspondre à LIMITE_MENSUELLE dans functions/src/assistant.ts. Le
 *  serveur fait foi ; ce nombre-ci ne sert qu'à l'annoncer avant la première
 *  question, quand on ne l'a pas encore reçu de lui. */
const LIMITE = 50

const tours = ref<Tour[]>([])
const question = ref('')
const enCours = ref(false)
const erreur = ref('')
const epuise = ref(false)
const restantes = ref<number | null>(null)
const fil = ref<HTMLElement | null>(null)
const champ = ref<HTMLTextAreaElement | null>(null)

/**
 * Trois questions tirées du dossier réel.
 *
 * Construites à partir de ce que le compte contient, et non écrites en dur :
 * « Mon cachet au Trabendo est-il dans le marché ? » se touche du doigt,
 * « posez une question sur vos cachets » demande un effort. Chacune a un repli
 * pour un compte encore vide, qui est précisément celui qui a le plus besoin
 * qu'on lui montre à quoi sert l'outil.
 */
const exemples = computed(() => {
  const liste: string[] = []

  const prochain = [...store.concerts]
    .filter((c) => c.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  liste.push(
    prochain?.venue
      ? `Mon cachet de ${prochain.fee} € au ${prochain.venue} est-il dans le marché ?`
      : 'Comment fixer mon cachet pour une première salle de 500 places ?',
  )

  /*  Le co-contractant plutôt que le titre du contrat : les titres sont longs
   *  et portent souvent déjà des guillemets — « Contrat d'enregistrement —
   *  Album « Aurora » » donnait une question illisible. Un nom de label est
   *  court et ne s'imbrique pas. */
  const contrat = store.contracts.find((c) => c.status !== 'Expiré')
  liste.push(
    contrat?.party
      ? `Que dois-je surveiller dans mon contrat avec ${contrat.party} ?`
      : 'Que dois-je surveiller avant de signer un contrat de licence ?',
  )

  liste.push(
    store.releases.length
      ? 'Comment déclarer mes titres à la SACEM et toucher mes droits voisins ?'
      : 'Par où commencer pour sortir mon premier EP ?',
  )

  return liste
})

function ajusterHauteur() {
  const el = champ.value
  if (!el) return
  /*  Remis à zéro avant d'être mesuré : sans cela, la zone grandit et ne
   *  rapetisse jamais quand on efface. */
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

async function auBas() {
  await nextTick()
  const el = fil.value
  if (el) el.scrollTop = el.scrollHeight
}

async function envoyer(texte?: string) {
  const demande = (texte ?? question.value).trim()
  if (!demande || enCours.value || epuise.value) return

  tours.value.push({ role: 'user', content: demande })
  question.value = ''
  erreur.value = ''
  enCours.value = true
  await nextTick()
  ajusterHauteur()
  void auBas()

  try {
    const { reponse, restantes: reste } = await demander(tours.value)
    tours.value.push({ role: 'assistant', content: reponse })
    restantes.value = reste
  } catch (e) {
    /*  La question est retirée de la conversation : la laisser sans réponse
     *  donnerait un fil bancal, et elle repartirait au prochain envoi — elle
     *  serait alors posée deux fois, et facturée deux fois. */
    tours.value.pop()
    question.value = demande
    if (e instanceof ErreurAssistant) {
      erreur.value = e.message
      epuise.value = e.epuise
      if (e.epuise) restantes.value = 0
    } else {
      erreur.value = "L'assistant n'a pas répondu. Réessayez dans un instant."
    }
  } finally {
    enCours.value = false
    void auBas()
  }
}

function vider() {
  tours.value = []
  erreur.value = ''
}
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* L'accueil, quand la conversation est vide. */
.accueil {
  text-align: center;
  padding: 26px 20px 10px;
}
.accueil__ico {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: var(--brand-gradient);
  color: #fff;
}
.accueil__ico svg {
  width: 26px;
  height: 26px;
}
.accueil__titre {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 14px 0 6px;
}
.accueil__lead {
  color: var(--text-soft);
  font-size: 14.5px;
  line-height: 1.6;
  max-width: 440px;
  margin: 0 auto;
}
.accueil__exemples {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 520px;
  margin: 22px auto 0;
}
.exemple {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 13px 15px;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.exemple:hover:not(:disabled) {
  border-color: var(--violet-400);
  background: var(--violet-50);
}
.exemple:disabled {
  opacity: 0.6;
  cursor: default;
}

/* La conversation. */
.fil {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: min(58vh, 560px);
  overflow-y: auto;
  padding: 4px 2px;
}
.tour {
  display: flex;
  gap: 11px;
  align-items: flex-start;
}
.tour--user {
  justify-content: flex-end;
}
.tour__ico {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 9px;
  background: var(--brand-gradient);
  color: #fff;
}
.tour__ico svg {
  width: 16px;
  height: 16px;
}
.tour__texte {
  font-size: 14.5px;
  line-height: 1.65;
  max-width: 78%;
}
.tour--user .tour__texte {
  background: var(--violet-600);
  color: #fff;
  padding: 11px 15px;
  border-radius: 16px 16px 4px 16px;
  white-space: pre-wrap;
}
.tour--assistant .tour__texte {
  color: var(--text);
}
/* Le HTML produit par enHtml : des paragraphes, des listes, du gras. */
.tour__texte :deep(p) {
  margin: 0 0 10px;
}
.tour__texte :deep(p:last-child) {
  margin-bottom: 0;
}
.tour__texte :deep(ul) {
  margin: 0 0 10px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tour__texte :deep(strong) {
  color: var(--text);
  font-weight: 650;
}

/* Les trois points de la réflexion. */
.reflexion {
  display: flex;
  gap: 5px;
  align-items: center;
  height: 26px;
}
.reflexion span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--violet-400);
  animation: respire 1.2s ease-in-out infinite;
}
.reflexion span:nth-child(2) {
  animation-delay: 0.18s;
}
.reflexion span:nth-child(3) {
  animation-delay: 0.36s;
}
@keyframes respire {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
/* Une animation qui ne s'arrête jamais est pénible pour qui y est sensible,
   et iOS comme Android ont un réglage pour le dire. */
@media (prefers-reduced-motion: reduce) {
  .reflexion span {
    animation: none;
    opacity: 0.55;
  }
}

/* La saisie. */
.saisie {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}
.saisie__champ {
  flex: 1;
  resize: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font: inherit;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text);
  background: var(--surface);
  max-height: 160px;
}
.saisie__champ:focus {
  outline: none;
  border-color: var(--violet-400);
}
.saisie__envoi {
  flex: none;
  width: 46px;
  height: 46px;
  padding: 0;
  justify-content: center;
}

.pied {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--text-muted);
}
.pied__vider {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 12.5px;
  color: var(--violet-600);
  cursor: pointer;
  text-decoration: underline;
}

.avertissement {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--text-muted);
  margin: 0;
}

.alert-err {
  background: var(--red-bg);
  color: var(--red);
  font-size: 13.5px;
  line-height: 1.5;
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  margin: 0;
}
</style>
