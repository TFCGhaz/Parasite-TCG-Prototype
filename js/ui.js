/* ════════════════════════════════════════════════════
   ui.js — UI helpers:
           card detail panel, action log entries,
           pass screen, log sidebar toggle
   ════════════════════════════════════════════════════ */

// ── Card Detail Panel ─────────────────────────────────

/**
 * Populate and show the card detail sidebar with full text for a card.
 * @param {string} cardId - key from the CARDS dictionary
 */
function showCardDetail(cardId) {
  const def = CARDS[cardId];
  if (!def) return;

  const nameEl   = document.getElementById('det-name');
  const typeEl   = document.getElementById('det-type');
  const statsEl  = document.getElementById('det-stats');
  const abilEl   = document.getElementById('det-ability');
  const flavEl   = document.getElementById('det-flavour');

  nameEl.textContent  = def.name;
  nameEl.style.color  = def.faction === 'weave' ? 'var(--weave-lt)' : 'var(--rem-lt)';

  typeEl.textContent  = `[${def.tags?.join('] [') || def.type}]  ·  Cost: ${def.cost}`;

  if (def.type === 'unit') {
    statsEl.innerHTML =
      `<span style="color:var(--rem-lt)">⚔ ATK ${def.atk}</span>` +
      `<span style="color:#4a90d0">🛡 DEF ${def.def}</span>`;
  } else {
    statsEl.textContent = 'ACTION CARD';
    statsEl.style.color = 'var(--text-dim)';
  }

  abilEl.textContent = def.ability  || '';
  flavEl.textContent = def.flavour  || '';

  document.getElementById('card-detail').classList.add('visible');
}

/** Hide the card detail panel. */
function hideCardDetail() {
  document.getElementById('card-detail').classList.remove('visible');
}

// ── Action Log ────────────────────────────────────────

/**
 * Append a line to the action log.
 * @param {string} type - CSS class: 'rem-log' | 'weave-log' | 'system-log' | 'combat-log'
 * @param {string} msg  - message text
 */
function log(type, msg) {
  const entry       = document.createElement('div');
  entry.className   = `log-entry ${type}`;
  entry.textContent = msg;

  const container = document.getElementById('log-entries');
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

/** Toggle the action log sidebar open/closed. */
function toggleLog() {
  document.getElementById('log-wrap').classList.toggle('open');
}

// ── Pass Screen ───────────────────────────────────────

/**
 * Show the full-screen pass screen so the device can be handed off.
 * @param {number} pnum - the player number whose turn is about to begin
 */
function showPassScreen(pnum) {
  const faction = G.players[pnum].faction.toUpperCase();
  const color   = pnum === 1 ? 'var(--rem-lt)' : 'var(--weave-lt)';

  document.getElementById('pass-title').textContent  = `PLAYER ${pnum}`;
  document.getElementById('pass-title').style.color  = color;
  document.getElementById('pass-msg').textContent    =
    `Pass the device to Player ${pnum} — ${faction}. Press ready when you're in position.`;

  document.getElementById('pass-screen').classList.add('visible');
}

/**
 * Dismiss the pass screen and run the Upkeep phase for the new active player.
 * Called by the "I'M READY" button in index.html.
 */
function dismissPass() {
  document.getElementById('pass-screen').classList.remove('visible');
  doUpkeep();            // run upkeep now that the right player is watching
  G.phase = 0;           // keep phase indicator at UPKEEP
  renderAll();
}
