/* ════════════════════════════════════════════════════
   state.js — Game state, initialisation, deck utils
   ════════════════════════════════════════════════════ */

const PHASES    = ['UPKEEP', 'DRAW', 'MAIN A', 'COMBAT', 'MAIN B', 'END'];
const BASE_RES  = { weave: 2, remnants: 2 };
const MAX_FIELD = 5;
const MAX_HAND  = 7;

// G is the single source of truth for all game state.
let G = {};

/**
 * Build a playable deck instance from a list of card IDs.
 * Each entry gets a unique uid and default runtime properties.
 */
function createDeck(idList) {
  return idList.map((id, i) => ({
    uid:             id + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
    cardId:          id,
    exhausted:       false,
    growthTokens:    0,
    infectionTokens: 0,
    currentAtk:      CARDS[id].atk  || 0,
    currentDef:      CARDS[id].def  || 0,
    maxDef:          CARDS[id].def  || 0,
    summonedThisTurn: false,
    overclocked:     false,
  }));
}

/** Fisher-Yates shuffle (mutates array, returns it). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Draw one card for the given player number.
 * If the deck is empty the player takes 2 fatigue damage instead.
 */
function drawCard(pnum, render = true) {
  const p = G.players[pnum];

  if (p.deck.length === 0) {
    p.life -= 2;
    log(pnum === 1 ? 'rem-log' : 'weave-log',
      `P${pnum} deck empty — took 2 fatigue damage.`);
    checkWin();
    return;
  }

  const card = p.deck.pop();
  p.hand.push(card);
  if (render) renderAll();
}

/** Full game reset — builds new decks, deals opening hands. */
function initGame() {
  const d1 = shuffle(createDeck(REMNANTS_DECK));
  const d2 = shuffle(createDeck(WEAVE_DECK));

  G = {
    turn:         1,
    activePlayer: 1,       // 1 = Remnants, 2 = Weave
    phase:        0,       // index into PHASES array
    corruption:   0,
    players: {
      1: { life: 20, res: 2, deck: d1, hand: [], field: [], discard: [], faction: 'remnants' },
      2: { life: 20, res: 2, deck: d2, hand: [], field: [], discard: [], faction: 'weave'    },
    },
    selectedHandCard:  null,   // uid of selected hand card
    selectedFieldCard: null,   // uid of selected field card
    combatState:       null,   // { attackerUid, phase: 'select_attacker' | 'select_target' }
    gameOver:          false,
  };

  // Deal opening hands (5 cards each, no render until done)
  for (let i = 0; i < 5; i++) drawCard(1, false);
  for (let i = 0; i < 5; i++) drawCard(2, false);

  log('system-log', '⚔ PARASITE TCG — Game Start. Player 1 (Remnants) goes first.');
  renderAll();
  showPassScreen(1);
}

/** Called by the New Game button in the win modal. */
function resetGame() {
  document.getElementById('modal-overlay').classList.remove('visible');
  initGame();
}
