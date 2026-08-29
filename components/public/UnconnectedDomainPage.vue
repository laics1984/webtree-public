<script setup lang="ts">
/**
 * Fowable fallback page.
 *
 * Used when:
 * 1. A hostname points to Fowable but no website is connected yet.
 * 2. A visitor reaches a hostname that no longer has a site.
 * 3. The CMS/API is unavailable.
 *
 * Deliberately self-contained:
 * - No API calls
 * - No external assets
 * - No site theme
 * - No dependency on CMS data
 *
 * The caller keeps the 404 status + noindex directive.
 */

const marketingUrl = 'https://fowable.com'
</script>

<template>
  <main class="wt-unconnected">
    <!-- Animated background -->

    <div class="wt-unconnected__background" aria-hidden="true">

      <div class="wt-unconnected__orb wt-unconnected__orb--one" />

      <div class="wt-unconnected__orb wt-unconnected__orb--two" />

      <div class="wt-unconnected__grid" />

      <div class="wt-unconnected__network">

        <span class="node node--1" />

        <span class="node node--2" />

        <span class="node node--3" />

        <span class="node node--4" />

        <span class="node node--5" />

        <span class="connection connection--1" />

        <span class="connection connection--2" />

        <span class="connection connection--3" />

        <span class="connection connection--4" />

      </div>

      <div class="wt-unconnected__scanline" />

    </div>

    <div class="wt-unconnected__container">

      <!-- Brand -->
      <header class="wt-unconnected__header">
        <a
          class="wt-unconnected__brand"
          :href="marketingUrl"
          aria-label="Fowable"
        >
          <span class="wt-unconnected__logo">
            <span>f</span>
          </span>

          <span class="wt-unconnected__brand-name">
            Fowable
          </span>
        </a>

        <span class="wt-unconnected__badge">
          <span class="wt-unconnected__badge-dot" />
          Build. Launch. Grow.
        </span>
      </header>

      <!-- Main content -->
      <section class="wt-unconnected__content">

        <!-- Status icon -->
        <div class="wt-unconnected__status-icon">
          <div class="wt-unconnected__status-ring" />
          <div class="wt-unconnected__status-core">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 12h12M13 7l5 5-5 5"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <p class="wt-unconnected__eyebrow">
          <span class="wt-unconnected__eyebrow-line" />
          Domain connection
        </p>

        <h1 class="wt-unconnected__title">
          Your site is
          <span>almost here.</span>
        </h1>

        <p class="wt-unconnected__description">
          This domain is pointing to Fowable, but there isn’t a website
          connected to it yet.
        </p>

        <!-- Connection status -->
        <div class="wt-unconnected__card">

          <div class="wt-unconnected__card-top">
            <div class="wt-unconnected__connection">
              <span class="wt-unconnected__connection-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8.5 12.5l3 3a4 4 0 005.657-5.657l-1.5-1.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                  <path
                    d="M15.5 11.5l-3-3a4 4 0 00-5.657 5.657l1.5 1.5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                  <path
                    d="M9.5 14.5l5-5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </span>

              <div>
                <strong>Domain detected</strong>
                <span>Waiting for your Fowable site</span>
              </div>
            </div>

            <span class="wt-unconnected__waiting">
              <span />
              Waiting
            </span>
          </div>

          <div class="wt-unconnected__progress">
            <span class="wt-unconnected__progress-active" />
            <span />
            <span />
          </div>

          <p class="wt-unconnected__hint">
            If you just updated your DNS settings, propagation can take
            a little while. You can safely refresh this page later.
          </p>
        </div>

        <!-- Actions -->
        <div class="wt-unconnected__actions">
          <a
            class="wt-unconnected__primary"
            :href="marketingUrl"
          >
            <span>Go to Fowable</span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10h11M10.5 5.5L15 10l-4.5 4.5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>

          <button
            class="wt-unconnected__secondary"
            type="button"
            onclick="window.location.reload()"
          >
            Refresh page
          </button>
        </div>

        <p class="wt-unconnected__footer-copy">
          Build your website with AI.
          <span>Publish it anywhere.</span>
        </p>

      </section>

      <!-- Footer -->
      <footer class="wt-unconnected__footer">
        <span>Powered by</span>

        <a :href="marketingUrl">
          Fowable
        </a>

        <span class="wt-unconnected__footer-separator">·</span>

        <span>Future of web</span>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.wt-unconnected {
  position: relative;
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(
      circle at 50% -10%,
      rgba(255, 255, 255, 1) 0%,
      rgba(250, 250, 247, 0.9) 38%,
      rgba(246, 246, 242, 1) 75%
    );
  color: #111111;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ─────────────────────────────────────────────
   Animated background
   ───────────────────────────────────────────── */

.wt-unconnected {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
  background: #f7f7f4;
}

.wt-unconnected__background {
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Moving ambient light */

.wt-unconnected__orb {
  position: absolute;
  width: 38rem;
  height: 38rem;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.28;
}

.wt-unconnected__orb--one {
  top: -28rem;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  animation: wt-orb-one 12s ease-in-out infinite;
}

.wt-unconnected__orb--two {
  right: -20rem;
  bottom: -24rem;
  background: #deded5;
  opacity: 0.22;
  animation: wt-orb-two 16s ease-in-out infinite;
}

/* Subtle moving grid */

.wt-unconnected__grid {
  position: absolute;
  inset: -100px;
  opacity: 0.42;

  background-image:
    linear-gradient(
      rgba(17, 17, 17, 0.035) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(17, 17, 17, 0.035) 1px,
      transparent 1px
    );

  background-size: 48px 48px;

  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.65),
    rgba(0, 0, 0, 0.2) 45%,
    transparent 85%
  );

  animation: wt-grid-drift 20s linear infinite;
}

/* ─────────────────────────────────────────────
   Network / connection animation
   ───────────────────────────────────────────── */

.wt-unconnected__network {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 52rem;
  height: 30rem;
  transform: translate(-50%, -50%);
  opacity: 0.28;
}

.wt-unconnected__network .node {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #777771;
  box-shadow:
    0 0 0 4px rgba(17, 17, 17, 0.025),
    0 0 18px rgba(17, 17, 17, 0.08);
  animation: wt-node-pulse 3s ease-in-out infinite;
}

.node--1 {
  top: 18%;
  left: 14%;
}

.node--2 {
  top: 38%;
  left: 32%;
  animation-delay: -0.8s !important;
}

.node--3 {
  top: 20%;
  right: 25%;
  animation-delay: -1.4s !important;
}

.node--4 {
  bottom: 27%;
  right: 14%;
  animation-delay: -2s !important;
}

.node--5 {
  bottom: 18%;
  left: 27%;
  animation-delay: -2.5s !important;
}

/* Connection lines */

.wt-unconnected__network .connection {
  position: absolute;
  height: 1px;
  transform-origin: left center;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(17, 17, 17, 0.12),
    transparent
  );
  animation: wt-connection-flow 5s ease-in-out infinite;
}

.connection--1 {
  top: 25%;
  left: 15%;
  width: 10rem;
  transform: rotate(28deg);
}

.connection--2 {
  top: 31%;
  left: 33%;
  width: 13rem;
  transform: rotate(-14deg);
  animation-delay: -1.3s !important;
}

.connection--3 {
  top: 23%;
  right: 22%;
  width: 9rem;
  transform: rotate(52deg);
  animation-delay: -2.1s !important;
}

.connection--4 {
  bottom: 25%;
  left: 28%;
  width: 14rem;
  transform: rotate(-18deg);
  animation-delay: -3s !important;
}

/* Very subtle horizontal light sweep */

.wt-unconnected__scanline {
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 30%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.35),
    transparent
  );
  filter: blur(20px);
  transform: rotate(-8deg);
  animation: wt-scan 12s ease-in-out infinite;
}

/* ─────────────────────────────────────────────
   Animations
   ───────────────────────────────────────────── */

@keyframes wt-grid-drift {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(48px, 48px, 0);
  }
}

@keyframes wt-orb-one {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }

  50% {
    transform: translateX(-50%) translateY(35px);
  }
}

@keyframes wt-orb-two {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(-45px, -35px, 0);
  }
}

@keyframes wt-node-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1.35);
  }
}

@keyframes wt-connection-flow {
  0%,
  100% {
    opacity: 0.15;
  }

  50% {
    opacity: 0.65;
  }
}

@keyframes wt-scan {
  0% {
    transform: translateY(-20%) rotate(-8deg);
    opacity: 0;
  }

  20% {
    opacity: 1;
  }

  55% {
    opacity: 0.6;
  }

  80%,
  100% {
    transform: translateY(430%) rotate(-8deg);
    opacity: 0;
  }
}

/* Accessibility */

@media (prefers-reduced-motion: reduce) {
  .wt-unconnected__grid,
  .wt-unconnected__orb,
  .wt-unconnected__network .node,
  .wt-unconnected__network .connection,
  .wt-unconnected__scanline {
    animation: none;
  }
}

/* ─────────────────────────────────────────────
   Layout
   ───────────────────────────────────────────── */

.wt-unconnected__container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 62rem;
  min-height: 100vh;
  margin: 0 auto;
  padding: 2rem 2rem 1.5rem;
}

.wt-unconnected__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.wt-unconnected__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: #111111;
  text-decoration: none;
}

.wt-unconnected__logo {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
  background: #111111;
  color: white;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.wt-unconnected__logo span {
  transform: translateY(-0.03em);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.08em;
}

.wt-unconnected__brand-name {
  font-size: 1.2rem;
  font-weight: 750;
  letter-spacing: -0.045em;
}

.wt-unconnected__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: #686863;
  font-size: 0.72rem;
  font-weight: 600;
  backdrop-filter: blur(12px);
}

.wt-unconnected__badge-dot {
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 50%;
  background: #8b8b83;
}

/* ─────────────────────────────────────────────
   Content
   ───────────────────────────────────────────── */

.wt-unconnected__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 40rem;
  margin: 0 auto;
  padding: 5rem 0 4rem;
  text-align: center;
}

/* ─────────────────────────────────────────────
   Status icon
   ───────────────────────────────────────────── */

.wt-unconnected__status-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 4.25rem;
  height: 4.25rem;
  margin-bottom: 1.7rem;
}

.wt-unconnected__status-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(17, 17, 17, 0.09);
  border-radius: 1.35rem;
  background: rgba(255, 255, 255, 0.42);
  box-shadow:
    0 12px 35px rgba(17, 17, 17, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

.wt-unconnected__status-core {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  background: #111111;
  color: white;
  box-shadow: 0 4px 12px rgba(17, 17, 17, 0.16);
}

.wt-unconnected__status-core svg {
  width: 1.05rem;
  height: 1.05rem;
}

/* ─────────────────────────────────────────────
   Typography
   ───────────────────────────────────────────── */

.wt-unconnected__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  color: #777771;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

.wt-unconnected__eyebrow-line {
  width: 1.1rem;
  height: 1px;
  background: #c8c8c0;
}

.wt-unconnected__title {
  max-width: 38rem;
  margin: 1rem 0 0;
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.065em;
}

.wt-unconnected__title span {
  display: block;
  background: linear-gradient(
    110deg,
    #111111 10%,
    #555550 55%,
    #8a8a83 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.wt-unconnected__description {
  max-width: 33rem;
  margin: 1.5rem auto 0;
  color: #686863;
  font-size: 1rem;
  line-height: 1.7;
  letter-spacing: -0.01em;
}

/* ─────────────────────────────────────────────
   Connection card
   ───────────────────────────────────────────── */

.wt-unconnected__card {
  width: 100%;
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid rgba(17, 17, 17, 0.09);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.62);
  box-shadow:
    0 18px 50px rgba(17, 17, 17, 0.045),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  text-align: left;
  backdrop-filter: blur(18px);
}

.wt-unconnected__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.wt-unconnected__connection {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wt-unconnected__connection-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 0.7rem;
  background: #f8f8f5;
  color: #4d4d48;
}

.wt-unconnected__connection-icon svg {
  width: 1.2rem;
  height: 1.2rem;
}

.wt-unconnected__connection strong {
  display: block;
  color: #20201e;
  font-size: 0.84rem;
  font-weight: 700;
}

.wt-unconnected__connection span {
  display: block;
  margin-top: 0.18rem;
  color: #85857e;
  font-size: 0.72rem;
}

.wt-unconnected__waiting {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #85857e;
  font-size: 0.7rem;
  font-weight: 650;
}

.wt-unconnected__waiting > span {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #b3b3aa;
  animation: wt-unconnected-pulse 2s ease-in-out infinite;
}

.wt-unconnected__progress {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.9rem;
}

.wt-unconnected__progress span {
  flex: 1;
  height: 0.2rem;
  border-radius: 999px;
  background: #e8e8e2;
}

.wt-unconnected__progress-active {
  background: #222222 !important;
}

.wt-unconnected__hint {
  margin: 0.8rem 0 0;
  padding: 0 0.15rem;
  color: #8a8a83;
  font-size: 0.7rem;
  line-height: 1.55;
}

/* ─────────────────────────────────────────────
   Actions
   ───────────────────────────────────────────── */

.wt-unconnected__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-top: 1.25rem;
}

.wt-unconnected__primary,
.wt-unconnected__secondary {
  min-height: 2.9rem;
  border-radius: 0.65rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.wt-unconnected__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0 1.1rem;
  background: #111111;
  color: white;
  text-decoration: none;
  box-shadow:
    0 4px 12px rgba(17, 17, 17, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition:
    transform 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease;
}

.wt-unconnected__primary svg {
  width: 1rem;
  height: 1rem;
  transition: transform 180ms ease;
}

.wt-unconnected__primary:hover {
  background: #292925;
  box-shadow:
    0 7px 18px rgba(17, 17, 17, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.wt-unconnected__primary:hover svg {
  transform: translateX(2px);
}

.wt-unconnected__secondary {
  padding: 0 1rem;
  border: 1px solid rgba(17, 17, 17, 0.1);
  background: rgba(255, 255, 255, 0.45);
  color: #5f5f5a;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.wt-unconnected__secondary:hover {
  border-color: rgba(17, 17, 17, 0.16);
  background: rgba(255, 255, 255, 0.8);
}

/* ─────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────── */

.wt-unconnected__footer-copy {
  margin: 2.1rem 0 0;
  color: #a0a099;
  font-size: 0.7rem;
  letter-spacing: -0.005em;
}

.wt-unconnected__footer-copy span {
  color: #777770;
}

.wt-unconnected__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #aaa9a2;
  font-size: 0.68rem;
}

.wt-unconnected__footer a {
  color: #777770;
  font-weight: 700;
  text-decoration: none;
}

.wt-unconnected__footer a:hover {
  color: #111111;
}

.wt-unconnected__footer-separator {
  color: #d0d0c9;
}

/* ─────────────────────────────────────────────
   Motion
   ───────────────────────────────────────────── */

@keyframes wt-unconnected-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(0.82);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wt-unconnected__waiting > span {
    animation: none;
  }

  .wt-unconnected__primary,
  .wt-unconnected__primary svg {
    transition: none;
  }
}

/* ─────────────────────────────────────────────
   Mobile
   ───────────────────────────────────────────── */

@media (max-width: 640px) {
  .wt-unconnected__container {
    padding: 1.25rem 1.25rem 1rem;
  }

  .wt-unconnected__badge {
    display: none;
  }

  .wt-unconnected__content {
    padding: 4rem 0 3rem;
  }

  .wt-unconnected__status-icon {
    width: 3.75rem;
    height: 3.75rem;
  }

  .wt-unconnected__title {
    font-size: clamp(2.75rem, 13vw, 4rem);
  }

  .wt-unconnected__description {
    margin-top: 1.25rem;
    font-size: 0.92rem;
  }

  .wt-unconnected__card {
    padding: 0.85rem;
  }

  .wt-unconnected__waiting {
    display: none;
  }

  .wt-unconnected__actions {
    width: 100%;
    flex-direction: column;
  }

  .wt-unconnected__primary,
  .wt-unconnected__secondary {
    width: 100%;
  }

  .wt-unconnected__footer-copy {
    margin-top: 1.75rem;
  }
}
</style>