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
  min-height: 100dvh;
  max-height: calc(100dvh - 130px);
  margin: 0 auto;
  padding: clamp(18px, 4vw, 34px);
  overflow: hidden auto;
  border-radius: 10px;
  border: 2px solid var(--surface-border);
  box-shadow: var(--shadow), inset 0 0 0 1px rgba(var(--bg-rgb), .18);
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

@media (max-width: 560px) {
  .passport-page {
    min-height: 100dvh;
    max-height: none;
    padding: 18px 16px;
    overflow: visible;
    border-radius: 8px;
  }

  .page-border {
    inset: 7px;
  }
}
</style>
