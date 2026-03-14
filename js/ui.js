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

// ── Card Hover Tooltip ─────────────────────────────────

let _tooltipTimer = null;
const _tooltip    = () => document.getElementById('card-tooltip');

/**
 * Attach mouseover / mouseleave / mousemove handlers to a card element.
 * Call this from buildCardEl right before returning the element.
 * @param {HTMLElement} el       - the card DOM element
 * @param {object}      cardInst - runtime card instance
 */
function attachTooltip(el, cardInst) {
  el.addEventListener('mouseenter', e => {
    clearTimeout(_tooltipTimer);
    _tooltipTimer = setTimeout(() => showTooltip(e, cardInst), 120);
  });
  el.addEventListener('mousemove', e => {
    positionTooltip(e);
  });
  el.addEventListener('mouseleave', () => {
    clearTimeout(_tooltipTimer);
    hideTooltip();
  });
}

function showTooltip(e, cardInst) {
  const def = CARDS[cardInst.cardId];
  const tip = _tooltip();

  // Faction class for colour theming
  tip.className = `visible tip-${def.faction}`;

  // Name
  document.getElementById('tip-name').textContent = def.name;

  // Tags + cost
  document.getElementById('tip-tags').textContent =
    `[${def.tags?.join('] [') || def.type.toUpperCase()}]`;

  // Stats row
  const statsEl = document.getElementById('tip-stats');
  if (def.type === 'unit') {
    statsEl.innerHTML =
      `<span class="tip-atk">ATK ${cardInst.currentAtk}</span>` +
      `<span class="tip-def">DEF ${cardInst.currentDef}</span>` +
      `<span class="tip-cost">Cost ${def.cost}</span>`;
  } else {
    statsEl.innerHTML = `<span style="color:var(--text-label)">ACTION</span>` +
      `<span class="tip-cost">Cost ${def.cost}</span>`;
  }

  // Runtime status badges
  const statusEl = document.getElementById('tip-status');
  statusEl.innerHTML = '';
  if (cardInst.exhausted) {
    statusEl.innerHTML += `<span class="tip-badge exhausted">EXHAUSTED</span>`;
  }
  if (def.tags?.includes('SURGE') && !cardInst.exhausted && cardInst.summonedThisTurn === false) {
    statusEl.innerHTML += `<span class="tip-badge surge">SURGE</span>`;
  }
  if (cardInst.growthTokens > 0) {
    const needed = 3;
    statusEl.innerHTML +=
      `<span class="tip-badge growth">GROWTH ${cardInst.growthTokens}/${needed}</span>`;
  }
  if (cardInst.infectionTokens > 0) {
    statusEl.innerHTML +=
      `<span class="tip-badge infected">INFECTED x${cardInst.infectionTokens} (-${cardInst.infectionTokens} ATK)</span>`;
  }

  // Ability + flavour
  document.getElementById('tip-ability').textContent = def.ability || '';
  document.getElementById('tip-flavour').textContent = def.flavour || '';

  positionTooltip(e);
}

function positionTooltip(e) {
  const tip = _tooltip();
  if (!tip.classList.contains('visible')) return;

  const pad = 14;
  const tw  = tip.offsetWidth  || 220;
  const th  = tip.offsetHeight || 200;
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;

  let x = e.clientX + pad;
  let y = e.clientY - th / 2;

  // Keep within viewport
  if (x + tw > vw - 10) x = e.clientX - tw - pad;
  if (y < 10)           y = 10;
  if (y + th > vh - 10) y = vh - th - 10;

  tip.style.left = x + 'px';
  tip.style.top  = y + 'px';
}

function hideTooltip() {
  _tooltip().className = '';   // removes 'visible' and faction class
}

// ── Coach Bubble ───────────────────────────────────────

// Content definitions for every phase + combat sub-state
const COACH_CONTENT = {
  UPKEEP: {
    title: 'Upkeep Phase',
    html: `Your resources have been topped up automatically. <br>
      <strong>Weave players:</strong> all your units just gained +1 Growth Token, and Corruption rose by 1.<br>
      <strong>Remnants players:</strong> you got a bonus +1 Scrap because Corruption is still low.<br><br>
      Nothing to do here &mdash; just press <span class="key">Next Phase &rarr;</span> to draw a card.`,
  },
  DRAW: {
    title: 'Draw Phase',
    html: `A card has been drawn from your deck automatically and added to your hand.<br><br>
      Press <span class="key">Next Phase &rarr;</span> to move to your Main Phase, where you can play cards.`,
  },
  'MAIN A': {
    title: 'Main Phase A &mdash; Play Cards',
    html: `This is your turn to build your board.<br><br>
      <strong>To play a card:</strong> hover over cards in your hand to read them, then <strong>click</strong> one to select it (it lifts up). Press <span class="key">Play Card</span> to place it.<br><br>
      You can play as many cards as you can afford. The cost is shown in the top-right corner of each card.<br><br>
      <strong>Units</strong> go to the field. <strong>Action cards</strong> (dashed border) fire instantly and are discarded.<br><br>
      Press <span class="key">Next Phase &rarr;</span> when done.`,
  },
  COMBAT: {
    title: 'Combat Phase',
    html: `Time to fight &mdash; or skip if you'd rather not risk your units.<br><br>
      <strong>To attack:</strong> press <span class="key">Declare Attack</span>, then click one of your non-exhausted units. It will glow red. Then click an enemy unit to fight it.<br><br>
      Both units deal damage <em>simultaneously</em>. If DEF reaches 0, the unit is destroyed.<br><br>
      If your opponent has no units, press <span class="key">Attack Player</span> to hit them directly.<br><br>
      You can attack with multiple units &mdash; once per un-exhausted unit. Press <span class="key">Next Phase &rarr;</span> when done.`,
  },
  COMBAT_PICK_ATTACKER: {
    title: 'Select Your Attacker',
    html: `Click one of your <strong>glowing units</strong> on the field to declare it as the attacker.<br><br>
      Exhausted units (greyed out) cannot attack. Units played this turn also can't attack unless they have <strong>SURGE</strong>.<br><br>
      Press <span class="key">Cancel</span> to back out of combat entirely.`,
  },
  COMBAT_PICK_TARGET: {
    title: 'Select a Target',
    html: `Your attacker is ready. Now choose what to hit:<br><br>
      &bull; <strong>Click an enemy unit</strong> to fight it. Both deal damage simultaneously.<br>
      &bull; Press <span class="key">Attack Player</span> to hit the opponent directly (only if they have no units, or you have PIERCING).<br><br>
      <strong>Tip:</strong> infected units deal &minus;1 ATK. A unit with 0 effective ATK still takes damage from the defender!`,
  },
  'MAIN B': {
    title: 'Main Phase B &mdash; Second Chance',
    html: `A second window to play cards after seeing how combat resolved.<br><br>
      <strong>Weave players:</strong> if any of your Crawlers have 3 Growth Tokens, they will Mutate automatically here into Mycelian Horrors (ATK 4 / DEF 5)!<br><br>
      Click a card to select it, then press <span class="key">Play Card</span>. Press <span class="key">Next Phase &rarr;</span> when finished.`,
  },
  END: {
    title: 'End Phase &mdash; Passing the Turn',
    html: `The turn is almost over. Any ATK boosts granted this turn are reset.<br><br>
      If you have more than <strong>7 cards</strong> in hand, the extras will be discarded automatically.<br><br>
      Press <span class="key">Next Phase &rarr;</span> to trigger the Pass Screen and hand the device to the other player.`,
  },
};

/** Update the coach bubble content for the current game state. */
function updateCoach() {
  if (!isCoachVisible()) return;

  const phase = PHASES[G.phase];
  let key = phase;

  // Use sub-state keys during combat
  if (phase === 'COMBAT' && G.combatState?.phase === 'select_attacker') key = 'COMBAT_PICK_ATTACKER';
  if (phase === 'COMBAT' && G.combatState?.phase === 'select_target')   key = 'COMBAT_PICK_TARGET';

  const content = COACH_CONTENT[key] || COACH_CONTENT[phase];
  if (!content) return;

  document.getElementById('coach-phase-tag').textContent = phase;
  document.getElementById('coach-title').textContent     = '';
  document.getElementById('coach-title').innerHTML       = content.title;
  document.getElementById('coach-text').innerHTML        = content.html;
}

function isCoachVisible() {
  const bubble = document.getElementById('coach-bubble');
  return bubble && !bubble.classList.contains('hidden');
}

/** Toggle coach bubble on/off (persisted for this session only). */
function toggleCoach() {
  const bubble = document.getElementById('coach-bubble');
  const toggle = document.getElementById('coach-toggle');
  if (bubble.classList.contains('hidden')) {
    bubble.classList.remove('hidden');
    toggle.classList.add('coach-on');
    updateCoach();
  } else {
    bubble.classList.add('hidden');
    toggle.classList.remove('coach-on');
  }
}

/**
 * Permanently dismiss the coach for this browser session.
 * Uses localStorage so it stays gone even after a page reload.
 */
function dismissCoach() {
  document.getElementById('coach-bubble').classList.add('hidden');
  document.getElementById('coach-toggle').classList.remove('coach-on');
  try { localStorage.setItem('parasite_coach_dismissed', '1'); } catch(e) {}
}

/** Called once on page load to restore coach preference. */
function initCoach() {
  let dismissed = false;
  try { dismissed = localStorage.getItem('parasite_coach_dismissed') === '1'; } catch(e) {}

  const toggle = document.getElementById('coach-toggle');
  if (dismissed) {
    document.getElementById('coach-bubble').classList.add('hidden');
    toggle.classList.remove('coach-on');
  } else {
    document.getElementById('coach-bubble').classList.remove('hidden');
    toggle.classList.add('coach-on');
    updateCoach();
  }
}
