# Bloodbound Summoner — Project Notes

## Current Status

Early prototype. `main.js` is a stub — no game logic implemented yet.
`game-design.md` is the active source of truth for all mechanics.
No UI layer. All development is console-first until further notice.

Systems implemented:

- Player state, Pain meter, Blood pool, Marrow
- Card play, cost resolution, effect logging
- Combat encounter loop (player turn, enemy turn, win/loss check)
- Draw system (deck, hand, discard, reshuffle with Blood drain penalty)
- Pack reward selection
- Shop (browse, buy, refresh)
- Act 1 node map structure (travel, unlock, secret discovery)
- Match reset

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

- `ub_minion_03` (Grave Crawler): on-death effect references Bone Shard by name. Must resolve to `ub_minion_01` by ID when on-death effect logic is implemented (see task 24).
- `payCost()`: sacrifice currently targets the last summon(s) on the field. Player choice of sacrifice target is a TODO for when UI is added.
- `applyEffect()`: effects are string-logged only. Full effect resolution system is a future task.
- `canAfford()`: blocks play if HP cost would reduce player to 0 or below. Death-on-cost edge case may need revisiting depending on desired lethality.
- `triggeredMilestones` is a module-level Set — must be reset on match start when match reset logic is implemented (task ties into Pain meter reset rule).
- `gainBlood()` reads `player.painZone` before `updatePainZone()` sets it. Blood gain on the damage that crosses the threshold fires at the old rate. Intentional for now — revisit if it feels wrong during testing.
- Enemy intent selection now supports simple cycles and weighted random via `intents` and `intentWeights` fields on enemies. Conditional intent logic (state-based behaviors) is a future enhancement.
- `enemyAttack()`: blocker is selected by highest defense automatically. Player choice of which summon defends is a TODO for when UI is added.
- `attackEnemy()` is called manually for now — no targeting system yet. Player picks which enemy to attack by passing enemyId directly.
- `resetMatch()`: currently rebuilds the deck via `buildDeck()` and `dealOpeningHand()`, but still needs to ensure the deck is always rebuilt from the full run card pool (see task 25).
- `offerPackRewards()` is currently always called with a hardcoded archetype string. When multiple archetypes are in the run pool, this should offer one pack per available archetype. TODO when second archetype is added.
- `run.collection` holds all acquired cards. Deck building and match reset must consistently rebuild `player.deck` from this collection; task 25 tracks wiring this fully into `buildDeck()` and `resetMatch()`.
- Act 1 map is hardcoded for now. Procedural or semi-random map generation is a future consideration once the node structure is proven.
- `run.discoveredHints` tracks hints per run. Cross-run hint persistence will need a save/storage system — pinned for when save state is scoped.
- `buildDeck()` requires run.collection to be populated before it's called. Calling resetMatch() on a fresh run with an empty collection will deal an empty hand. Starting deck composition (task list open question) needs to be resolved and seeded into run.collection before the first match.
- Shop inventory pools from Minion + Warrior tier only. When Champion and Apex cards are added (task 16), shop should weight by act — Act 1: Minion/Warrior only, Act 2: add Champion, Act 3: add Apex. Pass current act into generateShopInventory() when that's implemented.
- Hand cap is now 7. End-of-turn overflow is resolved by auto-discarding from the end of `player.hand` until the hand returns to 7. Player discard choice is a TODO for later UI/input support.
- Each forced discard drains 2 Blood and currently floors at 0.
- `drawCard()` reshuffles `player.discard` into `player.deck` when the deck is empty and discard has cards.
- Battlefield summon cap added. Summon cards cannot be played if the field is already at cap.
- `resolveRitual()`: HP cost (5) and card reward pool are hardcoded. When per-node data fields are added, ritual cost and reward tier should be driven by node data, not the function.
- `resolveRest()`: Heal amount (8) and Pain drain (5) are hardcoded. These may need tuning during playtesting; flag as balance constants.
- `resolveCurse()` / `resolveMystery()`: The curse pool is duplicated inline in both functions. When the curse system is formalized (effect resolution), extract to a `data/curses.js` data file and reference it from both resolvers.
- `resolveMystery()`: Uses `rollMarrow()` to generate the self-damage amount — this is intentional and saves a helper, but note it for clarity.
- `run.curses` is initialized lazily (`run.curses = run.curses || []`). When `run` is formalized with a start-of-run setup function, seed it there instead.
- `resolveGatekeeper()`: `run.artifacts` is now tracked, but no artifact reward source exists yet. Gatekeeper nodes that require artifacts will remain blocked until artifact-granting node rewards or boss/secret rewards are implemented.
- `run.artifacts` currently stores artifact IDs only. If artifact passives or metadata are needed later, move artifact definitions into a dedicated data file and store richer objects or resolve IDs through that data.
- Champion/Apex cards: `effect` strings are logged only — actual effect resolution (overflow absorption, resurrection, attack debuff) is pending the full effect system. Each will need a dedicated handler when that system is built, likely alongside curses (task 26) and enemy on-death effects (task 24).
- `bf_champion_01` (Fleshbinder): "heal 2 HP per summon on field" effect references player.field.length at summon time. When effect resolution is implemented, evaluate whether this fires before or after the summon itself is pushed to the field.
- `ub_champion_01` (Bonecage Titan): "absorbs overflow damage" changes the blocker resolution logic in `enemyAttack()`. When this effect is implemented, it will need to mark specific summons as overflow-blocking and adjust the damage routing there.
- `ub_apex_01` (The Hollow King): resurrection from discard requires reading player.discard — will need a target-selection step (auto or player-choice) when effect resolution is built.
- `apexLocked: true` is the only card-level flag that gates playability right now. If more unlock conditions are added later, consider a more general `requiresFlag` field on cards rather than adding more one-off booleans.
- `startRun()` currently only resets state; it does not call `buildDeck()` or seed a starting deck. Task 18 will wire starting deck seeding into `run.collection` and then build the deck.
- `run.archetype` is now set in `startRun()` and used when offering pack rewards. If multi-archetype runs are added later, pack selection will need a more flexible source for the archetype parameter.
- `startMatchForArchetype()` wraps `startRun()` + `buildDeck()` + `dealOpeningHand()` and accepts loose strings like "blood" or "bone" to avoid typo-prone archetype IDs during manual testing.
- `startMatch()` + `startMatchForArchetype()` provide a one-call dev flow to start a new run and first match (run init, deck build, opening hand) for either "blood" or "bone".
- `bf_ritual_01` (Bloodletting Rite): effect text assumes self-damage from the HP cost will correctly fill Blood and trigger Pain milestones; currently logged only, pending effect system hookup.
- `ub_sacrifice_01` (Bone Harvest): effect text references summoning Bone Shard from deck or discard by ID (`ub_minion_01`). Implementation is pending the general support/effect resolution system.

---

## Pinned for Later

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic
- Conditional branching path unlock requirements
- Gatekeeper artifact requirement specifics
- Additional archetypes: Demonic/Infernal, Void/Eldritch, Bound/Shackled
- Grunt/Soldier random targeting: low-tier enemies select attack targets randomly (player field or player directly) rather than always hitting the highest defense blocker. Trigger condition: enemy attack exceeds the defense of at least one field summon, or enemy has a direct damage effect. Adds chaos and risk to horde encounters.
- Secret archetype unlock: additional archetypes (Demonic/Infernal, Void/Eldritch, Bound/Shackled) are locked behind a secret objective spanning multiple runs. Hints are scattered across hidden secret nodes throughout Act 1. The player must discover all hints across separate runs before the unlock condition is met. Design specifics TBD when second archetype is scoped.
- Starting decks are fixed 10-card lists per archetype with no randomness yet. Future work: add small random swaps or weighted picks while preserving core archetype identity.
- Combat Marrow rewards use a simple per-enemy formula (Grunt = 1, Soldier = 2) with a minimum of 1. Elite/Boss values and node-type scaling are still TBD.
- `offerPackRewards()` is currently always called with a hardcoded archetype string. When the run archetype is tracked on `run`, this should pass `run.archetype` instead.
- `bf_ritual_01` (Bloodletting Rite): effect text assumes self-damage from the HP cost will correctly fill Blood and trigger Pain milestones; currently logged only, pending effect system hookup.
- `ub_sacrifice_01` (Bone Harvest): effect text references summoning Bone Shard from deck or discard by ID (`ub_minion_01`). Implementation is pending the general support/effect resolution system.
- On any boss win, grant one extra pack option (e.g., call offerPackRewards twice and merge results, or add a boss-only “treasure pack” template), without introducing a full artifact/unique-card loot table yet.
- Boss node support added:
  - Act 1 `node_12` is now `type: "boss"` and uses `enemies: ["boss_01"]`.
  - `resolveNode()` routes `"combat"` + `"boss"` nodes through `resolveCombatNode()`.
  - `resolveCombatNode()` pulls enemy objects from `data/enemies.js` by ID and calls `startEncounter()`.
- Boss encounters currently behave like harder combat nodes. No special boss-only rewards or loot tables yet; those are pinned for later.
- Combat wins now call `completeNode(act1Map.currentNodeId)` in `checkEncounterEnd()`, marking the current map node as completed and unlocking its connections.
- calculateMarrowReward() now differentiates Grunt/Soldier/Elite/Boss tiers. Bosses grant more base Marrow.
- Boss encounters grant an additional flat +3 Marrow bonus on victory, logged as a boss bonus. No special card/artifact rewards yet; full boss loot tables remain an open design item.
- Basic enemy on-death system added:
  - New handleEnemyDeath(deadEnemy) helper in main.js.
  - attackEnemy() now calls handleEnemyDeath() when an enemy HP drops to 0 or below.
  - Current implementation supports Hollow Thrall (grunt_03): on death, heals the next alive enemy in the encounter for 2 HP using its effect string ("On death: heals the next enemy in the encounter for 2 HP.").
- Other enemy effects (e.g., rage, bleed application, Grave Tyrant summon) still logged as text only and will be wired into turn/attack hooks later.
- Enemy damage triggers:
  - New handleEnemyDamaged(enemy, damageDealt) helper in main.js.
  - attackEnemy() calls handleEnemyDamaged() after damage is applied and before
    death is checked.
  - Vein Sentinel (soldier_03) now implements its Rage text: each time it takes
    damage, its attack increases by 1, logged in the console.

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
12. ✅ Draw system: shuffle run.collection into player.deck, deal opening hand.
13. ✅ Shop node logic: browse and purchase cards using Marrow
14. ✅ Ritual, Rest, Curse, Mystery node resolution
15. ✅ Gatekeeper artifact check
16. ✅ Champion + Apex tier cards for both archetypes
17. ✅ Add `startRun()` to initialize player, run state, and triggeredMilestones.
18. ✅ Define starting decks per archetype and seed `run.collection` in `startRun()`.
19. ✅ Grant Marrow on combat win in `checkEncounterEnd()` and call `offerPackRewards()`.
20. ✅ Add one Ritual and one Sacrifice support card to `data/cards.js`.
21. ✅ Add basic enemy intent cycling or weighted-random selection in `executeEnemyIntent()`.
22. ✅ Add one Elite and one Boss enemy per archetype with stats and simple abilities.
23. Add boss node encounters using new boss IDs.
24. Implement on-death enemy effects.
25. Wire run.collection into buildDeck() and resetMatch() so the deck is always rebuilt from the full run card pool.
26. Extract curse definitions into data/curses.js and have resolveCurse() and resolveMystery() pull from that shared pool.
27. Add one Relic and one Drain support card to data/cards.js as data-only entries (effect text only, no logic yet).
