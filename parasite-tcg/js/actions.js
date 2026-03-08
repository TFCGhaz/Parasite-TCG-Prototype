/* ════════════════════════════════════════════════════
   actions.js — Playing cards, action resolution,
                unit destruction, win & corruption checks
   ════════════════════════════════════════════════════ */

/**
 * Attempt to play the card with the given uid from pnum's hand.
 * Validates cost, field space, and phase before committing.
 */
function playCard(pnum, uid) {
  const p   = G.players[pnum];
  const idx = p.hand.findIndex(c => c.uid === uid);
  if (idx === -1) return;

  const cardInst = p.hand[idx];
  const def      = CARDS[cardInst.cardId];

  // ── Cost check ──
  if (p.res < def.cost) {
    log('system-log',
      `Not enough ${p.faction === 'weave' ? 'Biomass' : 'Scrap'} to play ${def.name}!`);
    return;
  }

  p.res -= def.cost;
  p.hand.splice(idx, 1);

  if (def.type === 'unit') {
    // ── Field limit ──
    if (p.field.length >= MAX_FIELD) {
      log('system-log', 'Field is full! Cannot play more units.');
      p.hand.push(cardInst);   // return card to hand
      p.res += def.cost;       // refund cost
      return;
    }

    // Summoning fatigue: SURGE units are ready immediately
    cardInst.summonedThisTurn = !def.tags?.includes('SURGE');
    cardInst.exhausted        = cardInst.summonedThisTurn;
    p.field.push(cardInst);

    // ── Entry triggers ──
    applyEntryTriggers(pnum, cardInst);

    log(pnum === 1 ? 'rem-log' : 'weave-log',
      `P${pnum} played ${def.name} [ATK ${cardInst.currentAtk} / DEF ${cardInst.currentDef}]`);

  } else {
    // Action card: resolve then discard
    resolveAction(pnum, cardInst);
    p.discard.push(cardInst);
    log(pnum === 1 ? 'rem-log' : 'weave-log',
      `P${pnum} played action: ${def.name}`);
  }

  G.selectedHandCard = null;
  renderAll();
}

/** Entry-trigger effects for unit cards. */
function applyEntryTriggers(pnum, cardInst) {
  const p   = G.players[pnum];
  const def = CARDS[cardInst.cardId];

  // PURIFIER: remove 1 Infection from another friendly unit
  if (def.tags?.includes('PURIFIER')) {
    const infected = p.field.filter(c => c.infectionTokens > 0 && c.uid !== cardInst.uid);
    if (infected.length > 0) {
      infected[0].infectionTokens = Math.max(0, infected[0].infectionTokens - 1);
      log(pnum === 1 ? 'rem-log' : 'weave-log',
        `${def.name} PURIFIER: removed 1 Infection from ${CARDS[infected[0].cardId].name}.`);
    }
  }

  // Salvage Runner: draw 1 card on entry
  if (cardInst.cardId === 'salvage_runner') {
    drawCard(pnum, false);
    log('rem-log', 'Salvage Runner: drew 1 card on entry.');
  }
}

/**
 * Resolve the effect of an action card.
 * Each case handles one specific card ID.
 */
function resolveAction(pnum, cardInst) {
  const p   = G.players[pnum];
  const opp = G.players[pnum === 1 ? 2 : 1];

  switch (cardInst.cardId) {

    case 'spore_burst': {
      if (p.field.length === 0) {
        log('weave-log', 'Spore Burst: no units to sacrifice.');
        p.res += CARDS[cardInst.cardId].cost; // refund
        break;
      }
      // Sacrifice weakest own unit, infect strongest enemy unit
      const weakest  = [...p.field].sort((a, b) => a.currentDef - b.currentDef)[0];
      destroyUnit(pnum, weakest.uid, false);
      if (opp.field.length > 0) {
        const strongest = [...opp.field].sort((a, b) => b.currentAtk - a.currentAtk)[0];
        strongest.infectionTokens += 2;
        log('weave-log',
          `Spore Burst: sacrificed ${CARDS[weakest.cardId].name}, ` +
          `infected ${CARDS[strongest.cardId].name} (×2).`);
      }
      break;
    }

    case 'biomass_surge':
      p.res += 3;
      log('weave-log', 'Biomass Surge: +3 Biomass.');
      break;

    case 'creeping_rot':
      opp.field.forEach(c => { c.infectionTokens += 1; });
      G.corruption = Math.min(20, G.corruption + 1);
      log('weave-log', 'Creeping Rot: all enemy units infected. Corruption +1.');
      break;

    case 'last_stand': {
      if (p.life > 8) {
        log('rem-log', 'Last Stand: can only be used when Life ≤ 8!');
        p.res += CARDS[cardInst.cardId].cost; // refund
        return; // keep card in discard (already pushed by caller)
      }
      p.field.forEach(c => {
        c.currentAtk       += 3;
        c.summonedThisTurn  = false;
        c.exhausted         = false;
      });
      drawCard(pnum, false);
      drawCard(pnum, false);
      log('rem-log', 'LAST STAND: All units +3 ATK & SURGE. Drew 2 cards.');
      break;
    }

    case 'overclock': {
      const mech = p.field.find(c => CARDS[c.cardId].tags?.includes('Mechanical'));
      if (!mech) {
        log('rem-log', 'Overclock: no Mechanical unit on field!');
        p.res += CARDS[cardInst.cardId].cost; // refund
        break;
      }
      mech.currentAtk += 3;
      mech.overclocked = true;
      log('rem-log',
        `Overclock: ${CARDS[mech.cardId].name} +3 ATK (takes 1 dmg after combat).`);
      break;
    }

    case 'purge_protocol':
      p.field.forEach(c => { c.infectionTokens = 0; });
      G.corruption = Math.max(0, G.corruption - 2);
      log('rem-log', 'Purge Protocol: all infections cleared. Corruption -2.');
      break;
  }
}

/**
 * Remove a unit from the field and trigger its death effects.
 * @param {number}  pnum   - owner's player number
 * @param {string}  uid    - unique card instance ID
 * @param {boolean} render - whether to call renderAll() afterwards
 */
function destroyUnit(pnum, uid, render = true) {
  const p   = G.players[pnum];
  const idx = p.field.findIndex(c => c.uid === uid);
  if (idx === -1) return;

  const cardInst = p.field.splice(idx, 1)[0];
  const def      = CARDS[cardInst.cardId];

  // ── Death triggers ──

  // Militia Grunt: gain 1 Scrap on death
  if (cardInst.cardId === 'militia_grunt') {
    p.res += 1;
    log('rem-log', 'Militia Grunt destroyed — gained 1 Scrap.');
  }

  // Parasitic Drone: infect a random enemy unit on death
  if (cardInst.cardId === 'parasitic_drone') {
    const opp = G.players[pnum === 1 ? 2 : 1];
    if (opp.field.length > 0) {
      const rand = opp.field[Math.floor(Math.random() * opp.field.length)];
      rand.infectionTokens++;
      log('weave-log',
        `Parasitic Drone death: infected ${CARDS[rand.cardId].name}.`);
    }
  }

  // VOLATILE: deal 2 damage to a random enemy unit
  if (def.tags?.includes('VOLATILE')) {
    const opp = G.players[pnum === 1 ? 2 : 1];
    if (opp.field.length > 0) {
      const target = opp.field[0];
      target.currentDef -= 2;
      log('weave-log',
        `${def.name} VOLATILE: dealt 2 damage to ${CARDS[target.cardId].name}.`);
      if (target.currentDef <= 0) destroyUnit(pnum === 1 ? 2 : 1, target.uid, false);
    }
  }

  p.discard.push(cardInst);
  log(pnum === 1 ? 'rem-log' : 'weave-log', `${def.name} was destroyed.`);
  if (render) renderAll();
}

/** Check whether either player has reached 0 life. */
function checkWin() {
  if (G.gameOver) return;
  if (G.players[1].life <= 0) {
    endGame(2, 'The Remnants have been overcome. The Weave absorbs all.');
  }
  if (G.players[2].life <= 0) {
    endGame(1, 'The Weave is suppressed — for now. The Remnants survive.');
  }
}

/** Check whether the Corruption Gauge has hit 20 (Weave wins). */
function checkCorruption() {
  if (G.corruption >= 20 && !G.gameOver) {
    endGame(2, 'Corruption Collapse — the world belongs to The Weave.');
  }
}

/** Display the win modal. */
function endGame(winner, msg) {
  G.gameOver = true;
  const faction  = winner === 1 ? 'THE REMNANTS' : 'THE WEAVE';
  const colorVar = winner === 1 ? 'var(--rem-lt)' : 'var(--weave-lt)';

  document.getElementById('modal-title').textContent  = faction + ' WIN';
  document.getElementById('modal-title').style.color  = colorVar;
  document.getElementById('modal-msg').textContent    = msg;
  document.getElementById('modal-overlay').classList.add('visible');
}
