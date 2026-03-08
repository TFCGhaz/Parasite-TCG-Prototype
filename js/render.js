/* ════════════════════════════════════════════════════
   render.js — DOM rendering:
               players, hands, fields, card elements,
               corruption gauge, phase dots, controls
   ════════════════════════════════════════════════════ */

/** Full re-render of all dynamic UI. Call after any state change. */
function renderAll() {
  renderPlayer(1);
  renderPlayer(2);
  renderCorruption();
  renderPhase();
  renderControls();
}

// ── Player ────────────────────────────────────────────

function renderPlayer(pnum) {
  const p = G.players[pnum];

  document.getElementById(`p${pnum}-life`).textContent          = p.life;
  document.getElementById(`p${pnum}-res`).textContent           = p.res;
  document.getElementById(`p${pnum}-deck-count`).textContent    = p.deck.length;
  document.getElementById(`p${pnum}-discard-count`).textContent = p.discard.length;

  renderHand(pnum);
  renderField(pnum);
}

// ── Hand ──────────────────────────────────────────────

function renderHand(pnum) {
  const p         = G.players[pnum];
  const container = document.getElementById(`p${pnum}-hand`);
  container.innerHTML = '';

  const isActive = G.activePlayer === pnum;

  p.hand.forEach(cardInst => {
    const def      = CARDS[cardInst.cardId];
    const inMain   = PHASES[G.phase] === 'MAIN A' || PHASES[G.phase] === 'MAIN B';
    const canPlay  = isActive && inMain && p.res >= def.cost && !G.gameOver;
    const selected = G.selectedHandCard === cardInst.uid;

    const el = buildCardEl(cardInst, 'hand-card', selected, canPlay);

    el.onclick = e => {
      e.stopPropagation();
      showCardDetail(cardInst.cardId);
      if (!canPlay) return;

      G.selectedHandCard  = (G.selectedHandCard === cardInst.uid) ? null : cardInst.uid;
      G.selectedFieldCard = null;
      renderAll();
    };

    container.appendChild(el);
  });
}

// ── Field ─────────────────────────────────────────────

function renderField(pnum) {
  const opp       = pnum === 1 ? 2 : 1;
  const p         = G.players[pnum];
  const container = document.getElementById(`p${pnum}-field`);

  // Preserve the static label element
  const label = container.querySelector('.field-row-label');
  container.innerHTML = '';
  if (label) container.appendChild(label);

  const isActive    = G.activePlayer === pnum;
  const inCombat    = PHASES[G.phase] === 'COMBAT';

  p.field.forEach(cardInst => {
    const isAttacker      = G.combatState?.attackerUid === cardInst.uid;
    const isValidAttacker = inCombat && G.combatState?.phase === 'select_attacker'
                            && isActive && !cardInst.exhausted;
    const isValidTarget   = inCombat && G.combatState?.phase === 'select_target'
                            && pnum === opp;

    const el = buildCardEl(cardInst, 'field-card', isAttacker, false);
    if (isValidAttacker) el.classList.add('valid-target');
    if (isValidTarget)   el.classList.add('valid-attack');

    el.onclick = e => {
      e.stopPropagation();
      showCardDetail(cardInst.cardId);
      if (G.combatState) {
        handleCombatClick(pnum, cardInst.uid);
      }
    };

    container.appendChild(el);
  });

  // Empty field slots
  const emptyCount = Math.max(0, MAX_FIELD - p.field.length);
  for (let i = 0; i < emptyCount; i++) {
    const slot = document.createElement('div');
    slot.className = 'field-slot';
    slot.textContent = 'empty';
    // Hide empty opponent slots when selecting a combat target
    if (inCombat && G.combatState?.phase === 'select_target' && pnum === opp) {
      slot.style.display = 'none';
    }
    container.appendChild(slot);
  }
}

// ── Card Element Builder ──────────────────────────────

/**
 * Build and return a card DOM element.
 * @param {object}  cardInst   - runtime card instance from game state
 * @param {string}  extraClass - 'hand-card' or 'field-card'
 * @param {boolean} selected   - whether this card is currently selected
 * @param {boolean} canPlay    - whether the card is currently playable
 */
function buildCardEl(cardInst, extraClass, selected, canPlay) {
  const def = CARDS[cardInst.cardId];

  const el = document.createElement('div');
  el.className = `card ${def.faction} ${def.type} ${extraClass}`;
  if (selected)              el.classList.add('selected');
  if (cardInst.exhausted)    el.classList.add('exhausted');
  if (cardInst.infectionTokens > 0) el.classList.add('infected');
  if (canPlay)               el.style.cursor = 'pointer';

  // ── Top row: faction icon + cost ──
  const top = document.createElement('div');
  top.className = 'card-top';
  top.innerHTML =
    `<span class="card-faction-icon">${def.icon}</span>` +
    `<span class="card-cost">${def.cost}</span>`;
  el.appendChild(top);

  // ── Art area ──
  const art = document.createElement('div');
  art.className   = 'card-art';
  art.textContent = def.art;
  el.appendChild(art);

  // ── Growth tokens (Weave units only) ──
  if (def.faction === 'weave' && def.type === 'unit' && cardInst.growthTokens > 0) {
    const gt = document.createElement('div');
    gt.className = 'growth-tokens';
    const visible = Math.min(cardInst.growthTokens, 5);
    for (let i = 0; i < visible; i++) {
      const dot = document.createElement('div');
      dot.className = 'growth-dot';
      gt.appendChild(dot);
    }
    el.appendChild(gt);
  }

  // ── Infection badge ──
  if (cardInst.infectionTokens > 0) {
    const badge = document.createElement('div');
    badge.className   = 'infection-badge';
    badge.textContent = `☣ ×${cardInst.infectionTokens}`;
    el.appendChild(badge);
  }

  // ── Card name ──
  const name = document.createElement('div');
  name.className   = 'card-name';
  name.textContent = def.name;
  el.appendChild(name);

  // ── Stats (units only) ──
  if (def.type === 'unit') {
    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.innerHTML =
      `<span class="card-atk">⚔${cardInst.currentAtk}</span>` +
      `<span class="card-def">🛡${cardInst.currentDef}</span>`;
    el.appendChild(stats);
  }

  // ── Type tag ──
  const tag = document.createElement('div');
  tag.className   = 'card-type-tag';
  tag.textContent = def.type.toUpperCase();
  el.appendChild(tag);

  return el;
}

// ── Corruption Gauge ──────────────────────────────────

function renderCorruption() {
  const pct = (G.corruption / 20) * 100;
  document.getElementById('gauge-fill').style.width = pct + '%';
  document.getElementById('gauge-value').textContent = G.corruption;
}

// ── Phase Indicator ───────────────────────────────────

function renderPhase() {
  document.getElementById('phase-name').textContent = PHASES[G.phase];

  const playerLabel = document.getElementById('active-player-label');
  playerLabel.textContent = `P${G.activePlayer} — ${G.players[G.activePlayer].faction.toUpperCase()}`;
  playerLabel.style.color = G.activePlayer === 1 ? 'var(--rem-lt)' : 'var(--weave-lt)';

  document.querySelectorAll('.phase-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i === G.phase)     dot.classList.add('active');
    else if (i < G.phase)  dot.classList.add('done');
  });
}

// ── Controls ──────────────────────────────────────────

function renderControls() {
  const phase    = PHASES[G.phase];
  const inMain   = phase === 'MAIN A' || phase === 'MAIN B';
  const inCombat = phase === 'COMBAT';

  const btnPlay   = document.getElementById('btn-play');
  const btnAttack = document.getElementById('btn-attack');
  const btnCancel = document.getElementById('btn-cancel');
  const btnEnd    = document.getElementById('btn-end-phase');

  btnPlay.disabled   = !(inMain && G.selectedHandCard && !G.gameOver);
  btnCancel.disabled = !(G.selectedHandCard || G.combatState);
  btnEnd.disabled    = G.gameOver;

  // Attack button: context-sensitive label and enabled state
  if (G.combatState?.phase === 'select_target') {
    btnAttack.textContent = 'Attack Player';
    btnAttack.disabled    = false;
  } else {
    btnAttack.textContent = 'Declare Attack';
    btnAttack.disabled    = !(inCombat && !G.combatState && !G.gameOver);
  }
}
