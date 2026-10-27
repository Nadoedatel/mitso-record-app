<template>
  <div v-if="isRetro" class="retro-decor" aria-hidden="true">
    <!-- Behind the content (z-index -1 inside #__nuxt): the page background is transparent in this design -->
    <div class="decor-back">
      <img class="back-moon" src="/theme-retro/moon-grunge.svg" alt="" />
      <div class="back-halftone" />
      <div class="back-end">終わり</div>
      <div class="back-ban">禁止</div>
      <div class="back-num back-num-l">03</div>
      <div class="back-num back-num-r">02</div>
      <div class="back-collage">
        <div class="line line-1"><span class="en">Don't look</span><span class="jp">見るな</span></div>
        <div class="line line-2"><span class="jp">君は</span><span class="en">you are</span></div>
        <div class="line line-3"><span class="en">grades</span><span class="jp">成績</span><span class="at">@</span><span class="jp">学生</span></div>
      </div>
      <div class="back-note back-note-l">
        <b>成績の世界に境界はない</b>
        THE WORLD OF GRADES<br />HAS NO BOUNDARIES
      </div>
      <div class="back-note back-note-r">
        <b>諦めない学生</b>
        STUDENTS NEVER<br />GIVE UP
      </div>
    </div>

    <!-- In front, tiny and pointer-less: only on wide screens so it never covers content -->
    <div class="decor-front">
      <div class="front-title">成績記録簿 <span class="front-sub">学生成績</span></div>
      <img class="front-sticker" src="/theme-retro/hologram-sticker.svg" alt="" />
      <div class="front-sign">
        <span class="sign-kanji">禁</span>
        <span class="sign-text">立入禁止</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/shared/lib/useTheme'

/**
 * Decor of the retro design, modelled on a Japanese record sleeve: giant moons, vertical kanji, a slowly pulsing "no entry" sign.
 * Purely decorative: hidden from screen readers, ignores the pointer. The pulse stops with prefers-reduced-motion.
 */
const isRetro = computed(() => useTheme().design.value === 'retro')
</script>

<style scoped>
.retro-decor {
  font-family: var(--font-jp);
  font-weight: 700;
  pointer-events: none;
}

/* ---------- Behind the content ---------- */
.decor-back {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  color: var(--retro-decor);
}

.back-moon {
  position: absolute;
  top: 4vh;
  left: -3vw;
  width: min(48vw, 520px);
  opacity: 0.95;
}

.back-halftone {
  position: absolute;
  inset: auto 0 0 auto;
  width: 60vw;
  height: 60vh;
  background-image: radial-gradient(var(--retro-ink) 22%, transparent 24%);
  background-size: 9px 9px;
  opacity: 0.22;
  mask-image: linear-gradient(to top left, #000, transparent 75%);
}

.back-end {
  position: absolute;
  right: 3vw;
  bottom: 2vh;
  writing-mode: vertical-rl;
  font-size: clamp(120px, 24vw, 340px);
  line-height: 1;
  opacity: 0.55;
}

.back-ban {
  position: absolute;
  left: 4vw;
  bottom: 6vh;
  font-size: clamp(90px, 16vw, 240px);
  line-height: 1;
  color: var(--retro-glow);
  opacity: 0.5;
  animation: ban-breathe 9s ease-in-out infinite;
}

/* Poster collage: cobalt headline in three scripts, small numbers and caption columns */
.back-num {
  position: absolute;
  top: 4vh;
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 88px);
  line-height: 1;
  color: var(--retro-blue);
}

.back-num-l {
  left: 3vw;
}

.back-num-r {
  right: 3vw;
}

.back-collage {
  position: absolute;
  top: 3vh;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 94vw;
  color: var(--retro-blue);
  line-height: 0.95;
  text-align: center;
}

.line {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.12em;
}

.line .en {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(34px, 7vw, 112px);
}

.line .jp {
  font-size: clamp(38px, 7.6vw, 120px);
}

.line-2 .en {
  font-size: clamp(30px, 6vw, 96px);
}

.line .at {
  font-family: var(--font-display);
  font-size: clamp(30px, 6vw, 96px);
}

.back-note {
  position: absolute;
  top: 24vh;
  width: 14vw;
  min-width: 120px;
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  line-height: 1.4;
  color: var(--retro-blue);
}

.back-note b {
  display: block;
  margin-bottom: 4px;
  font-family: var(--font-jp);
  font-size: 15px;
  letter-spacing: 0.15em;
}

.back-note-l {
  left: 3vw;
}

.back-note-r {
  right: 3vw;
  text-align: right;
}

/* Phone: cards fill the width, so big type behind them only shows in thin gaps and fights the text. Keep the moons and halftone */
@media (max-width: 767px) {
  .back-collage,
  .back-note,
  .back-num,
  .back-end,
  .back-ban {
    display: none;
  }

  .back-moon {
    width: 70vw;
    opacity: 0.6;
  }
}

/* ---------- In front, wide screens only ---------- */
.decor-front {
  display: none;
}

@media (min-width: 1200px) {
  .decor-front {
    display: block;
    position: fixed;
    inset: 0;
    z-index: var(--z-sticky);
  }
}

.front-title {
  position: absolute;
  top: 28px;
  right: 22px;
  writing-mode: vertical-rl;
  font-size: 26px;
  letter-spacing: 0.3em;
  color: var(--retro-glow);
  animation: sign-breathe 8s ease-in-out infinite;
}

.front-sub {
  font-size: 13px;
  opacity: 0.8;
}

.front-sticker {
  position: absolute;
  right: 60px;
  top: 28px;
  width: 150px;
  transform: rotate(3deg);
  opacity: 0.9;
}

.front-sign {
  position: absolute;
  right: 22px;
  bottom: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 9px;
  border: 2px solid var(--retro-glow);
  background: color-mix(in srgb, var(--retro-page) 80%, transparent);
  color: var(--retro-glow);
  transform: rotate(-4deg);
  animation: sign-breathe 8s ease-in-out infinite;
}

.sign-kanji {
  font-size: 32px;
  line-height: 1;
}

.sign-text {
  font-size: 11px;
  letter-spacing: 0.1em;
}

/* Slow fade in and out, no stutter and no glow: the "forbidden" mood without harsh flashes */
@keyframes sign-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@keyframes ban-breathe {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.25; }
}

@media (prefers-reduced-motion: reduce) {
  .front-title,
  .front-sign,
  .back-ban {
    animation: none;
  }
}
</style>
