<template>
  <article class="passport-page passport-security">
    <div class="page-border asset-page-border" />
    <slot />
  </article>
</template>

<style scoped>
.passport-page {
  position: relative;
  width: min(760px, 100%);
  min-height: calc(100svh - max(18px, env(safe-area-inset-top)) - max(18px, env(safe-area-inset-bottom)));
  min-height: calc(100dvh - max(18px, env(safe-area-inset-top)) - max(18px, env(safe-area-inset-bottom)));
  margin: 0 auto;
  padding: clamp(18px, 4vw, 34px);
  overflow: visible;
  border-radius: 10px;
  border: 2px solid var(--surface-border);
  box-shadow: var(--shadow), inset 0 0 0 1px rgba(var(--bg-rgb), .18);
  display: flex;
  flex-direction: column;
}

.page-border {
  position: absolute;
  inset: 10px;
  opacity: .8;
  pointer-events: none;
}

.passport-page :deep(> :not(.page-border)) {
  position: relative;
  z-index: 1;
}

.passport-page :deep(> .mission) {
  flex: 1;
}

@media (max-width: 560px) {
  .passport-page {
    min-height: calc(100svh - max(12px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)));
    min-height: calc(100dvh - max(12px, env(safe-area-inset-top)) - max(12px, env(safe-area-inset-bottom)));
    padding: 18px 16px;
    overflow: visible;
    border-radius: 8px;
  }

  .page-border {
    inset: 7px;
  }
}

@media (min-width: 820px) {
  .passport-page {
    min-height: calc(100svh - 56px);
    min-height: calc(100dvh - 56px);
  }
}
</style>
