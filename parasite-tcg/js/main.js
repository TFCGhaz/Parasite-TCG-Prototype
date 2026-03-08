/* ════════════════════════════════════════════════════
   main.js — Entry point:
             button event wiring, global listeners,
             game initialisation
   ════════════════════════════════════════════════════ */

// ── Button Handlers ───────────────────────────────────

document.getElementById('btn-play').onclick = () => {
  if (!G.selectedHandCard) return;
  playCard(G.activePlayer, G.selectedHandCard);
};

document.getElementById('btn-attack').onclick = () => {
  const phase = PHASES[G.phase];
  if (phase !== 'COMBAT') return;

  if (G.combatState?.phase === 'select_target') {
    // Second click on "Attack Player" — attempt direct hit
    attackPlayer();
  } else if (!G.combatState) {
    // First click — begin attacker selection
    startCombatPhase();
    renderAll();
  }
};

document.getElementById('btn-cancel').onclick = () => {
  G.selectedHandCard  = null;
  G.selectedFieldCard = null;

  if (G.combatState) {
    clearCombatState();
  }

  hideCardDetail();
  renderAll();
};

document.getElementById('btn-end-phase').onclick = () => {
  nextPhase();
};

// ── Global Listeners ──────────────────────────────────

// Clicking anywhere outside a card hides the detail panel
document.addEventListener('click', () => {
  hideCardDetail();
});

// ── Start ─────────────────────────────────────────────

initGame();
