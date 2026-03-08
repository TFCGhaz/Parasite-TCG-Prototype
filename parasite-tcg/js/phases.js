/* ════════════════════════════════════════════════════
   phases.js — Turn & phase management:
               Upkeep, Draw, Main A/B, Combat, End,
               turn transitions, Weave Mutation
   ════════════════════════════════════════════════════ */

/**
 * Advance to the next phase (or end the turn if already at END).
 * Clears any pending selections / combat state first.
 */
function nextPhase() {
  G.selectedHandCard  = null;
  G.selectedFieldCard = null;

  if (G.combatState) {
    clearCombatState();
  }

  const currentPhaseName = PHASES[G.phase];

  if (currentPhaseName === 'END') {
    endTurn();
    return;
  }

  G.phase++;
  const newPhaseName = PHASES[G.phase];

  // Auto-execute phases that don't need player input
  switch (newPhaseName) {
    case 'UPKEEP': doUpkeep(); break;
    case 'DRAW':   doDraw();   break;
    case 'COMBAT': startCombatPhase(); break;  // defined in combat.js
    case 'END':    doEnd();    break;
  }

  renderAll();
}

// ── Individual Phase Handlers ─────────────────────────

function doUpkeep() {
  const ap = G.activePlayer;
  const p  = G.players[ap];

  // Base resource income
  p.res += BASE_RES[p.faction];

  if (p.faction === 'weave') {
    // Corruption rises each Weave upkeep
    G.corruption = Math.min(20, G.corruption + 1);

    // Grow all Weave units and check for Mutation
    p.field.forEach(c => {
      c.growthTokens = (c.growthTokens || 0) + 1;
      if (c.cardId === 'mycelian_crawler' && c.growthTokens >= 3) {
        mutateCrawler(c);
      }
    });

    // Spore Node: each one gives an extra Corruption tick
    const sporeCount = p.field.filter(c => c.cardId === 'spore_node').length;
    G.corruption     = Math.min(20, G.corruption + sporeCount);
  }

  // Remnants get +1 Scrap when Corruption is low (0–5)
  if (p.faction === 'remnants' && G.corruption <= 5) {
    p.res += 1;
  }

  log(ap === 1 ? 'rem-log' : 'weave-log',
    `P${ap} Upkeep — ${p.faction === 'weave' ? 'Biomass' : 'Scrap'} is now ${p.res}.`);

  checkCorruption();
}

function doDraw() {
  drawCard(G.activePlayer);
  log(G.activePlayer === 1 ? 'rem-log' : 'weave-log',
    `P${G.activePlayer} drew a card.`);
}

function doEnd() {
  const p = G.players[G.activePlayer];

  // Discard down to MAX_HAND
  while (p.hand.length > MAX_HAND) {
    const discarded = p.hand.pop();
    p.discard.push(discarded);
    log(G.activePlayer === 1 ? 'rem-log' : 'weave-log',
      `P${G.activePlayer} discarded ${CARDS[discarded.cardId].name} (hand limit).`);
  }

  // Reset any ATK boosts gained via actions this turn
  p.field.forEach(c => {
    c.currentAtk = CARDS[c.cardId].atk || 0;
  });
}

function endTurn() {
  doEnd();

  // Switch active player
  G.activePlayer  = G.activePlayer === 1 ? 2 : 1;
  G.phase         = 0;

  // Unexhaust all units belonging to the new active player
  G.players[G.activePlayer].field.forEach(c => {
    c.exhausted        = false;
    c.summonedThisTurn = false;
  });

  G.turn++;
  log('system-log',
    `── Turn ${G.turn} — Player ${G.activePlayer} ` +
    `(${G.players[G.activePlayer].faction.toUpperCase()}) ──`);

  renderAll();
  showPassScreen(G.activePlayer);
}

// ── Weave Mutation ────────────────────────────────────

/**
 * Replace a Mycelian Crawler instance with Mycelian Horror in-place.
 * Preserves exhaustion state and Infection tokens.
 */
function mutateCrawler(cardInst) {
  const p   = G.players[G.activePlayer];
  const idx = p.field.findIndex(c => c.uid === cardInst.uid);
  if (idx === -1) return;

  const horror = {
    uid:              'mycelian_horror_' + Math.random().toString(36).slice(2, 8),
    cardId:           'mycelian_horror',
    exhausted:        cardInst.exhausted,
    growthTokens:     0,
    infectionTokens:  cardInst.infectionTokens,
    currentAtk:       4,
    currentDef:       5,
    maxDef:           5,
    summonedThisTurn: false,
    overclocked:      false,
  };

  p.field[idx] = horror;

  G.corruption = Math.min(20, G.corruption + 2);
  log('weave-log',
    '⚠ MUTATION! Mycelian Crawler → MYCELIAN HORROR [ATK 4 / DEF 5]! Corruption +2.');
}
