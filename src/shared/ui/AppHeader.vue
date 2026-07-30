<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink v-slot="{ href, navigate }" to="/today" custom>
        <a class="brand" :href="href" aria-label="Daymark home" @click="navigate">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M7 3.5h10a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5Z"
              />
              <path d="m8.25 12 2.35 2.35 5.15-5.15" />
            </svg>
          </span>
          <span>Daymark</span>
        </a>
      </RouterLink>

      <div class="app-header__actions">
        <button
          class="icon-button"
          type="button"
          aria-label="Notifications coming soon"
          title="Notifications coming soon"
          disabled
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
        </button>
        <button
          class="profile-button"
          type="button"
          aria-label="Profile menu coming soon"
          title="Profile menu coming soon"
          disabled
        >
          <span aria-hidden="true">AM</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  z-index: 20;
  top: 0;
  height: var(--header-height);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: var(--shadow-header);
  backdrop-filter: blur(16px);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding-inline: var(--space-6);
}

.brand {
  display: inline-flex;
  gap: var(--space-3);
  align-items: center;
  min-height: 2.75rem;
  color: var(--color-text);
  font-size: 1.125rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  text-decoration: none;
}

.brand__mark {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: white;
  background: var(--color-primary);
  border-radius: 0.625rem;
  place-items: center;
}

.brand__mark svg {
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.app-header__actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.icon-button,
.profile-button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  place-items: center;
}

.icon-button:hover {
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.icon-button:disabled,
.profile-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.icon-button:disabled:hover {
  color: var(--color-text-muted);
  background: transparent;
}

.icon-button svg {
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.profile-button {
  margin-left: var(--space-1);
  color: #fff;
  background: #252936;
  font-size: 0.75rem;
  font-weight: 700;
}

@media (max-width: 767px) {
  .app-header__inner {
    padding-inline: var(--space-4);
  }

  .brand__mark {
    width: 1.875rem;
    height: 1.875rem;
  }

  .icon-button,
  .profile-button {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
