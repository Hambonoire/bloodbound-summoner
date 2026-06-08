# Bloodbound Summoner — Project Notes

## Current Status

Early prototype. Core game logic lives in `main.js` and is still evolving.
`game-design.md` is the active source of truth for all mechanics.
No UI layer. All development is console-first until further notice.

Systems implemented:

- Player state, Pain meter, Blood pool, Marrow
- Card play, cost resolution, and first-pass support card effect resolution
- Combat encounter loop (player turn, enemy turn, win/loss check)
- Draw system (deck, hand, discard, reshuffle with Blood drain penalty)
- Pack reward selection
- Shop (browse, buy, refresh)
- Act 1 node map structure (travel, unlock, secret discovery)
- Match reset
- Basic enemy on-death, damage-triggered, and attack-triggered behaviors
- Enemy scaled damage helper (`scaledDamageByMissingHp`) wired into `enemyAttack()`
- Combat-start entry hook (`onCombatStart`) for curses, artifacts, and relics
- `generic_relic_01` passive logic: `player.relics` array, `maxBlood +2` on acquisition, 2 Blood on combat entry if Pain ≥ 10
- All system factories use injected dependencies — no bare globals in node resolvers or factory internals
- `enemySystem` (`createEnemySystem`) wraps enemy catalog with `getEnemyById`; injected into `createMapSystem`
- NPC / Wanderer node resolution (`resolveNPC`, hint chain advancement)
- Combat Mystery node resolution (`resolveCombatMystery`, weighted enemy pool)
- Updated Gatekeeper: dual-role (seal check + hint_01 seed)
- `checkHintChain()` helper — unlocks Hidden Secret on full hint chain
- Archetype seals (`artifact_blood_seal`, `artifact_bone_seal`) defined and granted on Act 1 boss kill
- `run.act` added to run state; initialized to 1 in `startRun()`
- Act 2 map stubbed in `data/map.js` (15-node, mirrors Act 1 shape)

---

## What's Been Decided

- Two starting archetypes: Blood/Flesh, Undead/Bone
- Summon hierarchy: Minion → Warrior → Champion → Apex
- Player stats: 30 HP, Blood pool max 10, Pain meter cap 40
- Pain meter: self-inflicted damage only, resets between matches
- Pain milestones: 10 / 20 / 30 / 40
- Six support card types: Ritual, Sacrifice, Curse, Hex, Relic, Drain
- Archetype-locked support cards with generic exceptions (Relic, Drain)
- Enemy tiers: Grunt, Soldier, Elite, Boss
- Enemy archetypes: Bloodhunter, Bonecaller, Cursebinder, Voidwalker
- Run structure: 3 acts, node map, branching paths unlock on node clear
- Node types: Combat, Shop, Ritual, Curse, Rest, Mystery, Gatekeeper, Hidden Secret, Combat Mystery, Wanderer (NPC)
- Currency: Marrow
- Pack types: Archetype packs, Rogue packs
- Enemy-dealt overflow damage intentionally bypasses Pain/Blood — only self-inflicted damage triggers those systems.
- Node count per act: 15 nodes, ratio defined in game-design.md Run Structure
- Act-clear condition: boss kill increments `run.act`; next act map loads
- Gatekeeper seeds `hint_01` on first contact (blocked or open)
- Hidden Secret unlocked by full hint chain (hint_01 + hint_02 + hint_03)
- Boss loot table: archetype seal (Act 1 only), 1 rare card, +3 Marrow, 50% Rogue pack offer
- Archetype seals derived from `run.archetype` at resolve time via `sealMap`

---

## Open Questions

- What does the Broken state penalty look like exactly (run ends immediately, or a final-chance mechanic)?
- Boss loot tables — quantities and act-specific contents for Acts 2 and 3 (Act 1 structure locked)
- Exact Marrow earn rates per node type
- Starting deck composition — which cards does the player begin a run with?
- What is the intended baseline battlefield summon cap, and should relics/cards be able to raise it temporarily or permanently?
- Should duplicate relics stack their passive effects (e.g., two `generic_relic_01` copies → `maxBlood +4`)? Currently blocked by duplicate guard in `applyBloodboundSigil`.
- How many nodes per act, and what is the rough ratio of node types?

---

## Known Issues / Dev Notes

### Card data and references

- `ub_minion_03` (Grave Crawler): On-death effect currently references Bone Shard by name; should resolve to `ub_minion_01` by ID when on-death logic is implemented.
- `bf_champion_01` (Fleshbinder): Currently wired. "heal 2 HP per summon on field" uses `player.field.length` at summon time; when effect resolution is implemented, does field count include or exclude the Fleshbinder itself? Currently excludes it (counted before field push) — confirm during playtesting.
- `ub_champion_01` (Bonecage Titan): Currently wired. "absorbs overflow damage" will need to flag specific summons as overflow-blocking and change damage routing in `enemyAttack()`. `absorbsOverflow` is set on the card instance via `applyCardEffect`, but `getEnemyById` returns a shallow copy via spread. If Titan is ever re-copied mid-encounter the flag survives since it's on the field instance directly — but worth a note that the flag lives on the card object in `player.field`, not on a separate status tracker.
- `ub_apex_01` (The Hollow King): resurrection from discard will need a target-selection step (auto or player choice) that reads `player.discard`.
- `apexLocked: true` is currently the only card-level playability gate; if more unlock conditions are added, consider a generic `requiresFlag` field instead of more booleans.
- `discardCard` is called inside `playCard` after `payCost` runs. Verify that sacrifice in `payCost` removes from `player.field` (not `player.hand`) so `discardCard` still finds the played card. Add a targeted test when revisiting sacrifice handling.
- `selectPack` in `data/economy.js` pushes card objects by reference into `run.collection`. Consider pushing copies (`{ ...card }`) to avoid shared-reference bugs if card state ever becomes mutable (curses, upgrades).

### Costs, Pain, Blood, and effect system

- `payCost()`: sacrifice cost currently targets the last summon(s) on the field; player choice of sacrifice target is deferred until UI exists.
- `canAfford()`: blocks play if an HP cost would reduce the player to 0 or below; the "death on cost" edge case may need revisiting depending on desired lethality.
- Pain meter: `triggeredMilestones` is a Set inside `createCostSystem` and must be reset on match start via `costSystem.resetMilestones()` alongside the Pain reset.
- `gainBlood()` reads `player.painZone` before `updatePainZone()` updates it, so Blood gain on the threshold-crossing damage uses the old rate; this is intentional for now but may be re-tuned after testing. Add a unit test for the doubled Blood rate at the `threshold` pain zone.
- First-pass card effect resolution is wired through `data/effects.js` via `createEffectSystem({ player, run, encounter, costSystem, combatSystem })` since combatSystem was injected in Task 41.
- `deckSystem.playCard()` resolves costs first through `costSystem.payCost(card)`, then card effects through `effectSystem.applyCardEffect(card)`, then performs normal post-play cleanup.
- `bf_ritual_01` (Bloodletting Rite): resolves through `data/effects.js`; after HP self-damage cost is paid, grants bonus Blood through the effect system.
- `ub_sacrifice_01` (Bone Harvest): resolves through `data/effects.js`; after sacrifice cost is paid, grants 2 Marrow and summons `ub_minion_01` (Bone Shard) from deck first, then discard. Field cap guard (`MAX_FIELD_SIZE`) added before push.
- `bf_drain_01` (Sanguine Siphon): handler added to `data/effects.js`. Deals 3 damage to first living enemy, heals player 3 HP (capped at `maxHp`), grants 1 Blood via `costSystem.gainBlood(1)`. Overflow-to-Pain and player-choice targeting are still deferred (marked with TODO in the handler).
- `generic_relic_01` (Bloodbound Sigil): fully wired. Raises `player.maxBlood` by 2 on acquisition, registers to `player.relics`, and grants 2 Blood on combat entry if Pain ≥ 10 via `onCombatStart()`. Duplicate guard prevents double-stacking.
- The effect system is still first-pass only; unhandled cards fall back to effect-text logging until dedicated handlers are added.
- Champion/Apex effects (overflow absorption, resurrection, attack debuff), curse application, and complex enemy/card interactions still need dedicated handlers.

### Combat flow and targeting

- **Refactor goal (architecture):** `combat.js` should only orchestrate flow (who attacks whom, win/loss checks). All effect calculus — damage, healing, Pain, Blood, armor math — should live in `status-effects.js` or `effects.js`. Partial progress in Task 41: `damageEnemy()` extracted as a shared helper and `combatSystem` injected into `effectSystem`. Full calculus migration still deferred — assess scope before next combat-system pass.
- `scaledDamageByMissingHp()` is now wired in `enemyAttack()` via effect text check. Applies to `grunt_02`, `elite_01`, and `boss_01`.
- Bleed (`applyBleedToPlayer`) fires in `executeEnemyIntent` for `soldier_02` via effect text string check. No change needed in `combat.js`.
- Enemy intent selection supports simple cycles and weighted random via `intents` and `intentWeights`; conditional (state-based) intent logic is a future enhancement.
- `enemyAttack()` auto-selects the highest-defense blocker; letting the player choose a defender is deferred until UI/input exist.
- `attackEnemy()` must be called manually; there is no targeting layer yet.
- Battlefield summon cap: summon cards cannot be played if the field is already at cap; relics/cards that modify this cap are a design/balance follow-up.

### Draw, hand management, and deck building

- Hand cap is 7; end-of-turn overflow discards cards from the end of `player.hand` until the cap is restored.
- Each forced discard drains 2 Blood and cannot reduce Blood below 0.
- `drawCard()` reshuffles `player.discard` into `player.deck` when the deck is empty and discard is non-empty.
- `run.collection` holds all acquired cards; deck-building and match reset always rebuild `player.deck` from this collection.
- `buildDeck()` requires `run.collection` to be populated; on a fresh run with an empty collection, calling `resetMatch()` deals an empty opening hand.
- `resetMatch()` rebuilds the deck via `buildDeck()` and `dealOpeningHand()` from the full run card pool.

### Run structure, archetypes, and multi-archetype support

- `run.archetype` is set in `startRun()` and drives pack offers; if multi-archetype runs are added later, pack selection needs a more flexible source than a single archetype string.
- `offerPackRewards()` is always passed a hardcoded archetype string; once runs can hold multiple archetypes, this should offer one pack per archetype in the run pool.
- `run.curses` is lazily initialized; when run setup is formalized, seed it in a start-of-run initializer instead.
- `run.discoveredHints` tracks hints per run; cross-run persistence will require a save/storage system scoped later.

### Map, node types, and per-node tuning

- Act 1 map is hardcoded; procedural or semi-random generation is a later consideration once node and run structure are proven.
- `resolveShop` is now wired via `case "shop"` in `resolveNode`.
- All node resolvers use injected dependencies via `createMapSystem` signature — no bare globals remain.
- `getEnemyById` is injected into `createMapSystem` via `enemySystem.getEnemyById` from `main.js`; the module-level instance inside `map.js` has been removed.
- `resolveRitual()`: HP cost (5) and card reward pool are hardcoded; once node data fields exist, both cost and reward tier should be data-driven.
- `resolveRest()`: heal amount (8) and Pain drain (5) are hardcoded balance constants for playtesting.
- `resolveCurse()` and `resolveMystery()` draw from the shared `data/curses.js` pool via `drawRandomCurses(1)`.
- `resolveMystery()` reuses `rollMarrow()` to generate self-damage amounts; intentional.
- Curse nodes draw from `data/curses.js`, store curse `id` in `run.curses`, and log name/effect. `logRunCurses()` resolves IDs for a one-line debug summary.
- `resolveNPC()` calls `checkHintChain()` on every completion — safe since it only acts when both hint IDs are present. If hint IDs ever change, update the string literals in `checkHintChain()` to match node npc.hintId values.
- NPC nodes complete normally via `completeNode()` — they unlock their
  connections immediately. node_11 (Hidden Secret) is a second unlock that fires only when the full chain is satisfied.
- `resolveCombatMystery()` rolls enemy composition at resolve time and writes it back to `node.enemies` so `checkEncounterEnd()` can mark the node complete via the standard combat win path. No special casing needed in `main.js`.
- Mystery pool weights are hardcoded for Act 1. When Act 2 is built, pass`node.act` or `run.act` into a pool selector so the pool scales with act difficulty.
- Elite solo (`elite_01`, `elite_02`) entries are weighted lower (2) than soldier pairs (3) — act-end nodes should feel hard but not always punishing. Tune after playtesting.
- `resolveGatekeeper()` derives the required seal from `run.archetype` at resolve time via `sealMap`. If new archetypes are added, extend `sealMap` and add their seal IDs to `data/artifacts.js`.
- `hint_01` seeds on first Gatekeeper contact (blocked or open) — this is intentional. Players who path straight to the gate get the hunt cue before backtracking. Players who took NPC branches already have hint_02/hint_03 but not hint_01 until they reach the gate.
- The gate remains permanently blocked until `artifact_blood_seal` or
  `artifact_bone_seal` is in `run.artifacts`. This is wired in Task 54.
- `run.act` added to run state in `main.js`. Must be incremented when act progression is wired (Task 55 / post-boss transition logic).
- Boss seal grant uses `run.act === 1` guard — Acts 2 and 3 bosses drop
  different loot (second rare card slot). Update the guard when act 2+ boss loot is defined.
- `getArtifactById` is re-required inside `checkEncounterEnd()` for the seal name lookup. If this causes any module caching concern, hoist the import to the top of `main.js` alongside the existing artifacts require.
- Act 2 map stubbed in `data/map.js`. All node types and branching connections are final — only enemy IDs, titles, and NPC dialogue need tuning before Act 2 goes live.
- `checkHintChain()` currently only checks Act 1 hint IDs (hint_02, hint_03). Extend it with an act-aware check (keyed on `run.act`) when Act 2 is activated, adding a2_hint_02 + a2_hint_03 → unlock a2_node_11.
- Act 2 Gatekeeper (`a2_node_13`) has empty `requiredArtifacts` — define
  the Act 2 gate artifact and wire its grant to the Act 2 boss kill.
- `resolveCombatMystery()` mystery pool is currently Act 1 only. Add an
  act-keyed pool selector when Act 2 enemies are defined.
- `getNode()` and `resolveNode()` currently only search `act1Map.nodes`.
  When Act 2 is activated, wire a map selector in `main.js` that passes
  the correct map to `mapSystem` based on `run.act`.
- `resolveNPC()` resolves Wanderer nodes; advances `run.discoveredHints`, logs dialogue, grants Marrow. NPC data lives on the node object (`node.npc`).
- `resolveCombatMystery()` rolls enemy composition at resolve time from a weighted pool; writes result back to `node.enemies` for `checkEncounterEnd()` compat. Pool is Act 1 only — extend with act-keyed selector when Act 2 enemies are defined.
- `checkHintChain()` checks for hint_02 + hint_03 and unlocks `node_11`. Extend with act-aware hint IDs when Act 2 is activated.
- `resolveGatekeeper()` derives required seal from `run.archetype` via `sealMap` at resolve time. Extend `sealMap` if new archetypes are added.
- Act 2 map stubbed with placeholder enemy IDs and TODO-flagged titles. `getNode()` and `resolveNode()` currently only search `act1Map.nodes` — wire a map selector keyed on `run.act` when Act 2 is activated.
- `resolveCombatMystery()` Act 2 pool: add act-keyed pool selector once Act 2 enemy IDs are defined.
- Act 2 Gatekeeper (`a2_node_13`) has empty `requiredArtifacts` — define the Act 2 gate artifact and wire its grant to the Act 2 boss kill.

### System init order (`main.js`)

- Correct instantiation order: `costSystem` → `combatSystem` → `enemySystem` → `effectSystem` → `deckSystem` → `shopSystem` → `economySystem` → `mapSystem`
- `mapSystem` must be last — it depends on `shopSystem`, `economySystem`, and `deckSystem.drawRandom`.
- `enemySystem` has no dependencies and can be instantiated any time before `mapSystem`.

### Rewards, Marrow, packs, and artifacts

- Shop inventory supports act-aware tier weighting via `generateShopInventory(act)`. Act tracking on nodes/run will be refined as multi-act maps are implemented.
- `drawRandom` is now injected into `createEconomySystem` — no bare global dependency remains.
- Artifact data lives in `data/artifacts.js` as data-only stubs. `run.artifacts` stores artifact IDs; `logRunArtifacts()` resolves and logs them. On-win minion grant wired in checkEncounterEnd().
- `artifact_blood_seal` and `artifact_bone_seal` defined in `data/artifacts.js` and granted in `checkEncounterEnd()` on Act 1 boss kill. Gatekeeper reads from `run.artifacts` via `resolveGatekeeper()`.
- Acts 2 and 3 boss loot (second rare card slot, act-specific artifacts) still deferred — blocked on Act 2 enemy and Gatekeeper artifact definitions.

### Combat-start entry hook

- `onCombatStart()` in `main.js` fires at the end of `startEncounter()`.
- Handles: `curse_blood_debt` (−2 HP), `artifact_blood_chalice` (+2 Blood), `generic_relic_01` (+2 Blood if Pain ≥ 10).
- Relic check is gated on `player.relics` — silently no-ops for relics not yet registered.

### Enemy effects (data-only, pending implementation)

- `soldier_02` (Cursebrand Warrior): Bleed fires via `executeEnemyIntent` effect-text check. ✅
- `grunt_02`, `elite_01`, `boss_01`: scaled damage wired via `scaledDamageByMissingHp()` in `enemyAttack()`. ✅
- Rage (`vein_sentinel`): wired in `handleEnemyDamaged()`. ✅
- `elite_02` (Bonecaller Adept): sacrifice/heal and on-kill damage bonus — no resolver. ✅
- `boss_01` (Bloodbound Butcher): self-wound buff at turn start — no resolver. ✅
- `boss_02` (Grave Tyrant): on-kill spawning and HP thresholds wired in combat.js. `thresholdsFired` Set initialized lazily on first damage — seed in `startEncounter()` when encounter reset is formalized. ✅

### Systems pinned to future work

- `curse_fragile_blood` and `curse_brittle_bones` now apply on acquire in data/map.js; `curse_clotted_pain` (Pain-gain reduction) still deferred as it requires touching `dealSelfDamage`.
- Artifact system: define effects in `data/artifacts.js` and wire into `run.artifacts`, Gatekeeper checks, and combat-start hook.
- Conditional enemy behaviors, richer targeting, player choice for sacrifices/blocks/discards, and more flexible Broken/Pain run mechanics deferred to later UI and systems work.

---

## Pinned for Later

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic
- Conditional branching path unlock requirements
- Act 2 Gatekeeper artifact: define ID, grant source, and `resolveGatekeeper()` `sealMap` entry
- Act 2 enemy IDs, NPC names/dialogue, and boss identity (currently stubbed with Act 1 placeholders)
- `checkHintChain()` act-aware extension for Act 2 hint IDs (a2_hint_02 + a2_hint_03 → unlock a2_node_11)
- Map selector in `main.js` keyed on `run.act` to route `getNode()` and `resolveNode()` to the correct act map
- Additional archetypes: Demonic/Infernal, Void/Eldritch, Bound/Shackled
- Secret archetype unlock spanning multiple runs (hint-based across Act 1)
- Starting deck variance: small random swaps or weighted picks while preserving core archetype identity
- Combat Marrow rewards: refine elite/boss values and node-type scaling
- On any boss win, grant one extra pack option (e.g., boss-only "treasure pack" template) without a full artifact/unique-card loot table yet
- Full curse effect resolution system
- Artifact passive effects wired into combat, map, and economy systems when run persistence/saves are scoped

---

## Task List (Priority Order)

1. ✅ Write starter card data — Blood/Flesh and Undead/Bone (Minion + Warrior)
2. ✅ Build player state object
3. ✅ Implement playCard()
4. ✅ Implement Pain meter tracking and milestone triggers
5. ✅ Implement Blood pool generation and spending
6. ✅ Build enemy data structure (Grunt + Soldier)
7. ✅ Stub out a single combat encounter loop
8. ✅ Implement match reset
9. ✅ Add pack reward selection
10. ✅ Stub out Act 1 node map structure
11. ✅ Add Marrow tracking
12. ✅ Draw system: shuffle run.collection into player.deck, deal opening hand
13. ✅ Shop node logic: browse and purchase cards using Marrow
14. ✅ Ritual, Rest, Curse, Mystery node resolution
15. ✅ Gatekeeper artifact check
16. ✅ Champion + Apex tier cards for both archetypes
17. ✅ Add `startRun()` to initialize player, run state, and triggeredMilestones
18. ✅ Define starting decks per archetype and seed `run.collection` in `startRun()`
19. ✅ Grant Marrow on combat win in `checkEncounterEnd()` and call `offerPackRewards()`
20. ✅ Add one Ritual and one Sacrifice support card to `data/cards.js`
21. ✅ Add basic enemy intent cycling or weighted-random selection in `executeEnemyIntent()`
22. ✅ Add one Elite and one Boss enemy per archetype with stats and simple abilities
23. ✅ Add boss node encounters using new boss IDs
24. ✅ Implement on-death enemy effects
25. ✅ Wire run.collection into buildDeck() and resetMatch() so the deck is always rebuilt from the full run card pool
26. ✅ Extract curse definitions into data/curses.js and have resolveCurse() and resolveMystery() pull from that shared pool
27. ✅ Add one Relic and one Drain support card to data/cards.js as data-only entries
28. ✅ Run init hardening
29. ✅ First-pass card effect system (Bloodletting Rite + Bone Harvest)
30. ✅ Wire bf_drain_01 (Sanguine Siphon) handler through data/effects.js
31. ✅ Fix `main.js` bare global wiring — route runtime calls through system instances
32. ✅ Instantiate `createEconomySystem`; add `player.maxBlood = 10` to `startRun()`
33. ✅ Add `case "shop"` to `resolveNode()` switch in `data/map.js`
34. ✅ Reconcile Gatekeeper artifact ID — cleared invalid `artifact_01` from `node_11`
35. ✅ Inject `drawRandom` into `createEconomySystem` factory
36. ✅ Inject dependencies into `createMapSystem`; move `getEnemyById` to `data/enemies.js`
37. ✅ Build `onCombatStart()` entry hook for relics, curses, and artifacts
38. ✅ Wire `generic_relic_01` passive logic (`player.relics`, `maxBlood +2`, combat-start Blood grant)
39. ✅ Add `MAX_FIELD_SIZE` guard to `applyBoneHarvest` in `data/effects.js`
40. ✅ First enemy-effect pass: Bleed (soldier_02), `scaledDamageByMissingHp` helper, Rage (already wired)
41. ✅ Combat/effect architecture refactor: move all stat calculus out of `combat.js` into `status-effects.js`/`effects.js`
42. ✅ Add shared artifact/curse foundation: wire `data/artifacts.js` and `data/curses.js` effects into run and combat lifecycle
43. ✅ Boss_02 mid-encounter enemy spawning — design threshold tracker and `encounter.enemies.push()` support
44. ✅ Refactor enemy effect hooks (onDamaged, onSummonKilled, onDeath, onAttack) into enemy data objects; migrate existing string-match handlers in combat.js to the new pattern
45. ✅ Wire elite_02 (Bonecaller Adept) effects — sacrifice/heal and on-kill damage bonus
46. ✅ Wire boss_01 (Bloodbound Butcher) self-wound buff at turn start
47. ✅ Champion card effect handlers — bf_champion_01 (Fleshbinder) heal-per-summon and ub_champion_01 (Bonecage Titan) overflow absorption in effects.js
48. ✅ Overworld scoping pass — resolve open design questions before Act 2 work begins:
    - Decide node count and type ratio for a standard act
    - Define act-clear condition and run progression trigger (Act 1 → Act 2 → Act 3)
    - Replace cleared node_11 Gatekeeper requirement with a real artifact ID and define how artifacts are granted (boss loot, secret nodes, shop?)
    - Define boss loot table contents (unique card? artifact? both?)
    - Sketch Act 2 node map structure (can mirror Act 1 shape initially)
    - Output: updated game-design.md sections for Run Structure and Node Types; updated map.js Act 2 stub
49. ✅ Rebuild `act1Map` node array in `data/map.js` — 15-node layout with named branching identities (Branch A: ritual/self-damage, Branch B: combat, Branch C/E: NPC/scavenger, Branch D/F: combat, act-end combat mystery nodes, Gatekeeper, Boss). Replace current 12-node hardcoded map.
50. ✅ Add `resolveNPC()` handler in `data/map.js` — resolves Wanderer nodes; advances hint chain via `run.discoveredHints`, logs NPC name/flavor, grants small Marrow reward. Add `case "npc"` to `resolveNode()` switch.
51. ✅ Add `resolveCombatMystery()` handler in `data/map.js` — rolls enemy composition at resolve time from a curated elite/unusual pool rather than fixed IDs; routes into existing `resolveCombatNode()`. Add
    `case "combat_mystery"` to `resolveNode()` switch.
52. ✅ Update `resolveGatekeeper()` in `data/map.js` — dual role: (1) check `run.artifacts` for player archetype seal (`artifact_blood_seal` or `artifact_bone_seal`), (2) seed `run.discoveredHints` with `hint_01` if not already present. Gate only opens when seal check passes.
53. ✅ Add `checkHintChain()` helper in `data/map.js` — called after any NPC or Wanderer node completes; unlocks the Hidden Secret node once both `hint_01` and `hint_02` are present in `run.discoveredHints`.
54. ✅ Add `artifact_blood_seal` and `artifact_bone_seal` to `data/artifacts.js` as data entries. Wire boss-kill grant in `main.js`: Act 1 boss death drops the player's archetype seal into `run.artifacts`.
55. ✅ Stub Act 2 map in `data/map.js` — mirror Act 1's 15-node shape with placeholder enemy IDs, adjusted node titles, and a comment flagging it for stat/enemy tuning. No new node types or resolvers needed yet.
56. ✅ Update `docs/game-design.md` — add Wanderer (NPC) and Combat Mystery to the Node Types table; update Run Structure section with node count (15), type ratio, act-clear condition, and boss loot table contents; add Hidden Secret scavenger hunt flow description.
