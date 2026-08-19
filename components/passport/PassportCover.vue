<template>
  <section class="cover passport-cover-texture">
    <div class="cover-border">
      <img class="emblem" src="~/assets/passport-design/generated_assets/rakia_emblem_placeholder.svg" alt="" />
      <p>דרכון רשמי</p>
      <h1>משימת רקיע</h1>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.cover {
  width: min(620px, 100%);
  min-height: min(760px, calc(100dvh - 36px));
  margin: 0 auto;
  padding: clamp(20px, 5vw, 34px);
  border-radius: 22px;
  color: var(--text);
  box-shadow: var(--shadow), inset 0 0 0 1px rgba(255,255,255,.05);
}

.cover-border {
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid var(--surface-border);
  border-radius: 16px;
  padding: clamp(22px, 5vw, 44px);
  text-align: center;
}

.emblem {
  width: min(210px, 50vw);
  margin: 20px auto 24px;
  filter: drop-shadow(0 7px 14px rgba(0,0,0,.3));
}

p {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-body);
  font-weight: 500;
}

h1 {
  margin: 8px 0 28px;
  font-size: clamp(2.1rem, 12vw, 4.4rem);
  line-height: .98;
  letter-spacing: 0;
  text-shadow: 0 2px 0 rgba(0,0,0,.28);
}
</style>
