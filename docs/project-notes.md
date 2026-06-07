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
- Node types: Combat, Shop, Ritual, Curse, Rest, Mystery, Gatekeeper, Hidden Secret
- Currency: Marrow
- Pack types: Archetype packs, Rogue packs
- Enemy-dealt overflow damage intentionally bypasses Pain/Blood — only self-inflicted damage triggers those systems. (Confirm and add explicit comment in `enemyAttack()` if not already present.)

---

## Open Questions

- What does the Broken state penalty look like exactly (run ends immediately, or a final-chance mechanic)?
- Boss loot tables — contents and quantities per act
- Exact Marrow earn rates per node type
- Starting deck composition — which cards does the player begin a run with?
- How many nodes per act, and what is the rough ratio of node types?
- What is the intended baseline battlefield summon cap, and should relics/cards be able to raise it temporarily or permanently?

---

## Known Issues / Dev Notes

### Card data and references

- `ub_minion_03` (Grave Crawler): on-death effect currently references Bone Shard by name; should resolve to `ub_minion_01` by ID when on-death logic is implemented.
- `bf_champion_01` (Fleshbinder): "heal 2 HP per summon on field" uses `player.field.length` at summon time; when effect resolution is implemented, decide whether it counts the new summon before or after it enters the field.
- `ub_champion_01` (Bonecage Titan): "absorbs overflow damage" will need to flag specific summons as overflow-blocking and change damage routing in `enemyAttack()`.
- `ub_apex_01` (The Hollow King): resurrection from discard will need a target-selection step (auto or player choice) that reads `player.discard`.
- `apexLocked: true` is currently the only card-level playability gate; if more unlock conditions are added, consider a generic `requiresFlag` field instead of more booleans.
- `applyBoneHarvest` in `data/effects.js` pushes directly to `player.field` without checking `MAX_FIELD_SIZE`. Add a guard before the push.
- `discardCard` is called inside `playCard` after `payCost` runs. Verify that sacrifice in `payCost` removes from `player.field` (not `player.hand`) so `discardCard` still finds the played card. Add a targeted test when revisiting sacrifice handling.
- `selectPack` in `data/economy.js` pushes card objects by reference into `run.collection`. Consider pushing copies (`{ ...card }`) to avoid shared-reference bugs if card state ever becomes mutable (curses, upgrades).

### Costs, Pain, Blood, and effect system

- `payCost()`: sacrifice cost currently targets the last summon(s) on the field; player choice of sacrifice target is deferred until UI exists.
- `canAfford()`: blocks play if an HP cost would reduce the player to 0 or below; the "death on cost" edge case may need revisiting depending on desired lethality.
- Pain meter: `triggeredMilestones` is a Set inside `createCostSystem` and must be reset on match start via `costSystem.resetMilestones()` alongside the Pain reset.
- `gainBlood()` reads `player.painZone` before `updatePainZone()` updates it, so Blood gain on the threshold-crossing damage uses the old rate; this is intentional for now but may be re-tuned after testing. Add a unit test for the doubled Blood rate at the `threshold` pain zone.
- First-pass card effect resolution is wired through `data/effects.js` via `createEffectSystem({ player, run, encounter, costSystem })`.
- `deckSystem.playCard()` resolves costs first through `costSystem.payCost(card)`, then card effects through `effectSystem.applyCardEffect(card)`, then performs normal post-play cleanup.
- `bf_ritual_01` (Bloodletting Rite): resolves through `data/effects.js`; after HP self-damage cost is paid, grants bonus Blood through the effect system.
- `ub_sacrifice_01` (Bone Harvest): resolves through `data/effects.js`; after sacrifice cost is paid, grants 2 Marrow and summons `ub_minion_01` (Bone Shard) from deck first, then discard.
- `bf_drain_01` (Sanguine Siphon): handler added to `data/effects.js`. Deals 3 damage to first living enemy, heals player 3 HP (capped at `maxHp`), grants 1 Blood via `costSystem.gainBlood(1)`. Overflow-to-Pain and player-choice targeting are still deferred (marked with TODO in the handler).
- `generic_relic_01` (Bloodbound Sigil): no passive logic wired yet. Raises `player.maxBlood` by 2 and grants 2 Blood on combat entry if Pain ≥ 10. Needs `player.relics` array and a combat-start entry hook (see combat-start hook note below).
- The effect system is still first-pass only; unhandled cards fall back to effect-text logging until dedicated handlers are added.
- Champion/Apex effects (overflow absorption, resurrection, attack debuff), curse application, and complex enemy/card interactions still need dedicated handlers.

### Combat flow and targeting

- **Refactor goal (architecture):** `combat.js` should only orchestrate flow (who attacks whom, win/loss checks). All effect calculus — damage, healing, Pain, Blood, armor math — should live in `status-effects.js` or `effects.js`. `combat.js` calls into those systems rather than performing its own stat math. Scope TBD; assess before the next combat-system pass.
- `applySanguineSiphon` in `data/effects.js` hits `target.hp` directly and does not call `combatSystem.handleEnemyDeath` if drain kills an enemy. Fix: either inject `combatSystem` into `effectSystem`, or extract a shared `damageEnemy(target, amount)` helper that both systems call.
- `enemyAttack()`: enemy overflow damage hits `player.hp` directly without calling `dealSelfDamage` — this is intentional (enemy damage does not trigger Pain/Blood). Add an explicit comment to make this self-documenting.
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
- `startRun()` resets state and seeds the archetype starting deck into `run.collection` but does not currently reset `player.maxBlood` to its default (10). Add `player.maxBlood = 10;` to `startRun()` alongside the other stat resets.

### Run structure, archetypes, and multi-archetype support

- `run.archetype` is set in `startRun()` and drives pack offers; if multi-archetype runs are added later, pack selection needs a more flexible source than a single archetype string.
- `offerPackRewards()` is always passed a hardcoded archetype string; once runs can hold multiple archetypes, this should offer one pack per archetype in the run pool.
- `run.curses` is lazily initialized; when run setup is formalized, seed it in a start-of-run initializer instead.
- `run.discoveredHints` tracks hints per run; cross-run persistence will require a save/storage system scoped later.

### Map, node types, and per-node tuning

- Act 1 map is hardcoded; procedural or semi-random generation is a later consideration once node and run structure are proven.
- **`resolveShop` is defined in `data/map.js` but missing from the `switch` in `resolveNode`.** Shop map nodes silently fall through to the default log and do nothing. Add `case "shop": resolveShop(node); break;`.
- **Node resolvers use bare globals** (`player`, `run`, `cards`, `shop`, `dealSelfDamage`, `updatePainZone`, `earnMarrow`, `rollMarrow`, `drawRandom`, `startEncounter`, `completeNode`). These are not injected into `createMapSystem` — resolvers work when called from `main.js` but cannot be unit-tested in isolation and will throw if called outside that scope. Requires a dependency-injection pass when the map system is next revisited.
- `resolveRitual()`: HP cost (5) and card reward pool are hardcoded; once node data fields exist, both cost and reward tier should be data-driven.
- `resolveRest()`: heal amount (8) and Pain drain (5) are hardcoded balance constants for playtesting.
- `resolveCurse()` and `resolveMystery()` draw from the shared `data/curses.js` pool via `drawRandomCurses(1)`.
- `resolveMystery()` reuses `rollMarrow()` to generate self-damage amounts; intentional.
- **`resolveGatekeeper()` checks for `"artifact_01"`**, but no artifact with that ID exists in `data/artifacts.js` (current IDs: `artifact_blood_chalice`, `artifact_bone_totem`). Update `node_11`'s `requiredArtifacts` to a real catalog ID, or add `artifact_01` to the catalog.
- Curse nodes draw from `data/curses.js`, store curse `id` in `run.curses`, and log name/effect. `logRunCurses()` resolves IDs for a one-line debug summary.

### Rewards, Marrow, packs, and artifacts

- Shop inventory supports act-aware tier weighting via `generateShopInventory(act)`. Act tracking on nodes/run will be refined as multi-act maps are implemented.
- **`generatePackBonus` and `generatePack` in `data/economy.js` call `drawRandom` as a bare global** — not injected into the factory. Same class of issue as map.js node resolvers. Fix when testing economy in isolation.
- **`createEconomySystem` is imported in `main.js` but never instantiated.** Add `const economySystem = createEconomySystem({ player, run, cards });` after the other system inits.
- Artifact data lives in `data/artifacts.js` as data-only stubs. `run.artifacts` stores artifact IDs; `logRunArtifacts()` resolves and logs them. No artifact passive effects are wired into combat or map systems yet.
- Boss/secret rewards and artifact-granting sources are not yet implemented; Gatekeeper and artifact-related progression are blocked on this.

### Combat-start entry hook

- `curse_blood_debt` (lose 2 HP at combat start), `generic_relic_01` (gain 2 Blood at combat start if Pain ≥ 10), and `artifact_blood_chalice` (gain 2 Blood at combat start) all need the same entry-trigger pass. Build one shared combat-start hook in `main.js` or `combat.js` that fires active relics and curses when a combat begins.

### Main.js wiring gap

- **`main.js` runtime loop calls multiple bare globals** that are not defined or imported at the top level: `dealSelfDamage`, `playCard`, `earnMarrow`, `calculateMarrowReward`, `offerPackRewards`, `completeNode`, `applyBleedToPlayer`, `endTurnDiscardDownToLimit`. These need to route through the correct system instances:
  - `costSystem.dealSelfDamage()`
  - `deckSystem.playCard()`
  - `economySystem.earnMarrow()`, `economySystem.calculateMarrowReward()`, `economySystem.offerPackRewards()`
  - `mapSystem.completeNode()`
  - `costSystem.applyBleedToPlayer()`
  - `deckSystem.endTurnDiscardDownToLimit()`
- This is the primary runtime wiring gap; the game loop will throw on any path that hits these calls.

### Enemy effects (data-only, pending implementation)

- `soldier_02` (Cursebrand Warrior): Bleed application on attack — `applyBleedToPlayer` exists and is exported from `status-effects.js` but is not called from `combat.js` when this enemy attacks.
- `elite_02` (Bonecaller Adept): sacrifice/heal and on-kill damage bonus — no resolver.
- `boss_01` (Bloodbound Butcher): self-wound buff at turn start — no resolver.
- `boss_02` (Grave Tyrant): on-kill summon spawn and HP-threshold heal/armor — requires mid-encounter enemy spawning (`encounter.enemies.push()`) and a threshold tracker on the enemy object. Needs design before implementation.
- `grunt_02`, `elite_01`, `boss_01` all share "deals +1 damage per 5 HP player is missing." Extract as a shared `scaledDamageByMissingHp(enemy, player)` helper when implementing to avoid three separate copies.

### Systems pinned to future work

- Curse effect resolution: curses are data-only; effects like `curse_fragile_blood` (reduce `maxHp`) and `curse_brittle_bones` (reduce `maxBlood`) need to be applied at run/combat start and tracked for reversal.
- Artifact system: define effects in `data/artifacts.js` and wire into `run.artifacts`, Gatekeeper checks, and combat-start hook.
- Conditional enemy behaviors, richer targeting, player choice for sacrifices/blocks/discards, and more flexible Broken/Pain run mechanics deferred to later UI and systems work.

---

## Pinned for Later

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic
- Conditional branching path unlock requirements
- Gatekeeper artifact requirement specifics
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
31. Fix `main.js` bare global wiring — route runtime calls through system instances (`costSystem`, `deckSystem`, `economySystem`, `mapSystem`)
32. Instantiate `createEconomySystem` in `main.js`; add `player.maxBlood = 10` to `startRun()`
33. Add `case "shop"` to `resolveNode()` switch in `data/map.js`
34. Reconcile Gatekeeper artifact ID — update `node_11.requiredArtifacts` to a real catalog ID
35. Inject `drawRandom` into `createEconomySystem` factory (remove bare global dependency)
36. Inject dependencies into `createMapSystem` node resolvers (remove bare global dependencies)
37. Build combat-start entry hook for relics, curses, and artifacts
38. Wire `generic_relic_01` passive logic (`player.relics` array + combat-start hook)
39. Add `applyBoneHarvest` `MAX_FIELD_SIZE` guard in `data/effects.js`
40. First enemy-effect pass: Bleed (soldier_02), shared `scaledDamageByMissingHp` helper, Rage (already wired)
41. Combat/effect architecture refactor: move all stat calculus out of `combat.js` into `status-effects.js`/`effects.js`
42. Add shared artifact/curse foundation: wire `data/artifacts.js` and `data/curses.js` effects into run and combat lifecycle
43. Boss_02 mid-encounter enemy spawning — design threshold tracker and `encounter.enemies.push()` support
