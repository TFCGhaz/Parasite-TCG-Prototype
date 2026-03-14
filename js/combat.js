/* ════════════════════════════════════════════════════
   combat.js — Combat phase state machine:
               attacker selection, target selection,
               damage resolution, direct player attack
   ════════════════════════════════════════════════════ */

/** Begin the combat phase: reset state and prompt for attacker. */
function startCombatPhase() {
  G.combatState = { phase: 'select_attacker', attackerUid: null };
  setCombatNotice('COMBAT: Select one of your units to attack');
  renderAll();
  updateCoach();
}

/**
 * Route a field-card click through the combat state machine.
 * @param {number} pnum - player who owns the clicked card
 * @param {string} uid  - uid of the clicked card instance
 */
function handleCombatClick(pnum, uid) {
  if (!G.combatState) return;

  const ap  = G.activePlayer;
  const opp = ap === 1 ? 2 : 1;

  // ── Phase: choose attacker ───────────────────────
  if (G.combatState.phase === 'select_attacker') {
    if (pnum !== ap) {
      log('system-log', 'Select one of YOUR units to attack.');
      return;
    }

    const unit = G.players[ap].field.find(c => c.uid === uid);
    if (!unit) return;

    if (unit.exhausted) {
      log('system-log', 'That unit is Exhausted and cannot attack this turn.');
      return;
    }

    G.combatState.attackerUid = uid;
    G.combatState.phase       = 'select_target';
    setCombatNotice('COMBAT: Select an enemy unit to block, or click "Attack Player"');
    renderAll();
    updateCoach();
    return;
  }

  // ── Phase: choose target ─────────────────────────
  if (G.combatState.phase === 'select_target') {
    if (pnum !== opp) {
      // Clicked own side — cancel and re-select attacker
      G.combatState.phase       = 'select_attacker';
      G.combatState.attackerUid = null;
      setCombatNotice('COMBAT: Select one of your units to attack');
      renderAll();
      return;
    }

    resolveCombat(G.combatState.attackerUid, uid);
  }
}

/**
 * Attack the opposing player directly (skips unit blocking).
 * Only allowed when the opponent has no units, or the attacker has PIERCING.
 */
function attackPlayer() {
  if (!G.combatState || G.combatState.phase !== 'select_target') {
    log('system-log', 'Select an attacker first before attacking the player.');
    return;
  }

  const ap  = G.activePlayer;
  const opp = ap === 1 ? 2 : 1;

  const attacker = G.players[ap].field.find(c => c.uid === G.combatState.attackerUid);
  if (!attacker) return;

  const def = CARDS[attacker.cardId];

  // Block direct attacks when opponent has units (unless PIERCING)
  if (G.players[opp].field.length > 0 && !def.tags?.includes('PIERCING')) {
    log('system-log', 'Cannot attack player directly while the opponent has units on field!');
    return;
  }

  const atkVal = effectiveAtk(attacker);
  G.players[opp].life -= atkVal;
  attacker.exhausted   = true;

  log('combat-log',
    `${def.name} attacked Player ${opp} directly for ${atkVal} damage!`);

  clearCombatState();
  checkWin();
  renderAll();
}

/**
 * Resolve combat between two unit instances simultaneously.
 * Handles: infection penalty, PIERCING, Spore Node retaliation, Overclock damage.
 */
function resolveCombat(attackerUid, defenderUid) {
  const ap  = G.activePlayer;
  const opp = ap === 1 ? 2 : 1;

  const attacker = G.players[ap].field.find(c => c.uid === attackerUid);
  const defender = G.players[opp].field.find(c => c.uid === defenderUid);
  if (!attacker || !defender) return;

  const atkDef = CARDS[attacker.cardId];
  const defDef = CARDS[defender.cardId];

  const atkVal = effectiveAtk(attacker);
  const defVal = effectiveAtk(defender);

  // Simultaneous damage
  defender.currentDef -= atkVal;
  attacker.currentDef -= defVal;
  attacker.exhausted   = true;

  log('combat-log',
    `${atkDef.name} [ATK ${atkVal}] attacks ${defDef.name} [ATK ${defVal}]`);

  // Tendril Lurker on-attack infection
  if (attacker.cardId === 'tendril_lurker') {
    defender.infectionTokens++;
    log('weave-log', `Tendril Lurker: infected ${defDef.name}.`);
  }

  // Spore Node retaliation: infect the attacker
  if (defender.cardId === 'spore_node') {
    attacker.infectionTokens++;
    log('weave-log', `Spore Node retaliation: ${atkDef.name} is now infected.`);
  }

  // PIERCING: excess damage carries over to the opposing player
  if (atkDef.tags?.includes('PIERCING') && defender.currentDef < 0) {
    G.players[opp].life += defender.currentDef; // negative number reduces life
    log('combat-log',
      `PIERCING: ${Math.abs(defender.currentDef)} excess damage dealt to Player ${opp}!`);
    defender.currentDef = 0;
  }

  // Overclock self-damage after combat
  if (attacker.overclocked) {
    attacker.currentDef -= 1;
    attacker.overclocked = false;
    log('rem-log', `Overclock: ${atkDef.name} took 1 self-damage.`);
  }

  // Corruption rises when a Weave unit survives combat
  if (atkDef.faction === 'weave' && attacker.currentDef > 0) {
    G.corruption = Math.min(20, G.corruption + 1);
  }

  // Death checks (check both before rendering)
  if (defender.currentDef <= 0) destroyUnit(opp, defenderUid,  false);
  if (attacker.currentDef <= 0) destroyUnit(ap,  attackerUid,  false);

  clearCombatState();
  checkWin();
  checkCorruption();
  renderAll();
}

// ── Helpers ──────────────────────────────────────────

/**
 * Return the effective ATK of a unit, reduced by 1 if infected.
 */
function effectiveAtk(cardInst) {
  return Math.max(0, cardInst.currentAtk - (cardInst.infectionTokens > 0 ? 1 : 0));
}

function setCombatNotice(msg) {
  const el = document.getElementById('combat-pending');
  el.textContent = msg;
  el.classList.add('visible');
}

function clearCombatState() {
  G.combatState = null;
  document.getElementById('combat-pending').classList.remove('visible');
}
