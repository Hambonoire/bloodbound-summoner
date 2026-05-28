# Bloodbound Summoner — Project Notes

## Current Status

Early prototype. Core game logic lives in `main.js` and is still evolving.
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

# Card data and references:

- ub_minion_03 (Grave Crawler): on-death effect currently references Bone Shard by name; should resolve to ub_minion_01 by ID when on-death logic is implemented (see task 24).
- ub_sacrifice_01 (Bone Harvest): effect text references summoning Bone Shard from deck or discard by ID (ub_minion_01); implementation is pending the general support/effect resolution system.
- bf_champion_01 (Fleshbinder): "heal 2 HP per summon on field" uses player.field.length at summon time; when effect resolution is implemented, decide whether it counts the new summon before or after it enters the field.
- ub_champion_01 (Bonecage Titan): "absorbs overflow damage" will need to flag specific summons as overflow-blocking and change damage routing in enemyAttack().
- ub_apex_01 (The Hollow King): resurrection from discard will need a target-selection step (auto or player choice) that reads player.discard.
- apexLocked: true is currently the only card-level playability gate; if more unlock conditions are added, consider a generic requiresFlag field instead of more booleans.

# Costs, Pain, Blood, and effect system:

- payCost(): sacrifice cost currently targets the last summon(s) on the field; player choice of sacrifice target is deferred until UI exists.
- canAfford(): blocks play if an HP cost would reduce the player to 0 or below; the "death on cost" edge case may need revisiting depending on desired lethality.
- Pain meter: triggeredMilestones is a module-level Set and must be reset on match start alongside the Pain reset rule.
- gainBlood() reads player.painZone before updatePainZone() updates it, so Blood gain on the threshold-crossing damage uses the old rate; this is intentional for now but may be re-tuned after testing.
- applyEffect(): currently logs effect strings only; full effect resolution (including curses, champion/apex effects, and enemy on-death effects) is a future system.
- Champion/Apex effects (overflow absorption, resurrection, attack debuff) all rely on the future effect system and will each need dedicated handlers, likely implemented alongside curses (task 26) and enemy on-death (task 24).
- bf_ritual_01 (Bloodletting Rite): effect text assumes HP self-damage from the cost will correctly fill Blood and trigger Pain milestones; currently logged only, pending hook-up to the effect system.

# Combat flow and targeting:

- Enemy intent: selection supports simple cycles and weighted random via intents and intentWeights; conditional (state-based) intent logic is a future enhancement.
- enemyAttack(): currently auto-selects the highest-defense blocker; letting the player choose a defender is deferred until UI/input exist.
- attackEnemy() must be called manually; there is no targeting layer yet, and the player picks the enemy by passing enemyId directly.
- Battlefield summon cap: summon cards cannot be played if the field is already at cap; relics/cards that modify this cap are a design/balance follow-up.

# Draw, hand management, and deck building:

- Hand cap is 7; end-of-turn overflow discards cards from the end of player.hand until the cap is restored.
- Each forced discard drains 2 Blood and cannot reduce Blood below 0.
- drawCard() reshuffles player.discard into player.deck when the deck is empty and discard is non-empty.
- run.collection holds all acquired cards; deck-building and match reset must always rebuild player.deck from this collection (tracked under task 25).
- buildDeck() requires run.collection to be populated; on a fresh run with an empty collection, calling resetMatch() deals an empty opening hand.
- resetMatch() currently rebuilds the deck via buildDeck() and dealOpeningHand() but still needs to guarantee that the deck is rebuilt from the full run card pool, not a stale subset.
- startRun() only resets state and does not call buildDeck() or seed a starting deck; task 18 will seed the archetype starting deck into run.collection and then build the deck.
- startMatchForArchetype() wraps startRun() + buildDeck() + dealOpeningHand() and accepts loose strings ("blood", "bone") to avoid typo-prone IDs in manual testing; startMatch()/startMatchForArchetype() together provide a one-call dev flow to begin a new run and first match.
- [x] Deck rebuilding: `resetMatch()` now clears field/hand/deck/discard and calls `buildDeck()` + `dealOpeningHand()` so the draw pile is always rebuilt from the full `run.collection` pool after `startRun()` seeds it.
- [ ] Verify `buildDeck()` always uses `run.collection` (no stale references to earlier deck arrays) and update to a `createDeckSystem` factory when the deck subsystem is fully migrated.

# Run structure, archetypes, and multi-archetype support:

- run.archetype is set in startRun() and currently drives pack offers; if multi-archetype runs are added later, pack selection will need a more flexible source than a single archetype string.
- offerPackRewards() is always passed a hardcoded archetype string; once runs can hold multiple archetypes, this should offer one pack per archetype in the run pool.
- run.curses is lazily initialized (run.curses = run.curses || []); when run setup is formalized, this should be seeded in a start-of-run initializer instead.
- run.discoveredHints tracks hints per run; cross-run persistence will require a save/storage system scoped later.

# Map, node types, and per-node tuning

- Act 1 map is currently hardcoded; procedural or semi-random map generation is a later consideration once the node and run structure are proven.
- resolveRitual(): HP cost (5) and card reward pool are hardcoded; once node data fields exist, both cost and reward tier should be driven by the node instead of the function.
- resolveRest(): heal amount (8) and Pain drain (5) are hardcoded balance constants and may need tuning during playtesting.
- resolveCurse() and resolveMystery() both duplicate an inline curse pool; when the curse system is formalized, extract a shared data/curses.js file referenced by both.
- resolveMystery() uses rollMarrow() to generate self-damage; this is intentional and reuses the helper, but worth calling out for clarity.
- resolveGatekeeper(): run.artifacts is now tracked, but no artifact reward source exists yet; Gatekeeper nodes that require artifacts will remain blocked until some node/boss/secret source can grant them.

# Rewards, Marrow, packs, and artifacts:

- Shop inventory currently pulls from Minion and Warrior tiers only; when Champion and Apex cards are added (task 16), inventory should be weighted by act (Act 1: Minion/Warrior, Act 2: +Champion, Act 3: +Apex) and generateShopInventory() should receive the current act.
- run.artifacts currently stores artifact IDs only; if artifact passives or metadata become richer, move artifact definitions into a dedicated data file and either store full objects or resolve IDs through that file.
- Boss/secret rewards and any artifact-granting sources are not yet implemented; Gatekeeper and artifact-related progression are blocked on this reward layer.

# Systems pinned to future work

- Curse system: move all curse definitions to a shared data/curses.js pool and have both resolveCurse() and resolveMystery() draw from it.
- Artifact system: define artifact data and effects in a dedicated file once run persistence/saves are scoped, then wire them into run.artifacts and Gatekeeper checks.
- Conditional enemy behaviors, richer targeting, player choice for sacrifices/blocks/discards, and more flexible Broken/Pain run mechanics are all deferred to later UI and systems work.

---

## Pinned for later

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic
- Conditional branching path unlock requirements
- Gatekeeper artifact requirement specifics
- Additional archetypes: Demonic/Infernal, Void/Eldritch, Bound/Shackled
- Secret archetype unlock spanning multiple runs (hint-based across Act 1)
- Starting deck variance: small random swaps or weighted picks while
  preserving core archetype identity
- Combat Marrow rewards: refine elite/boss values and node-type scaling
- On any boss win, grant one extra pack option (e.g., boss-only “treasure pack”
  template) without a full artifact/unique-card loot table yet
- Full curse system and shared `data/curses.js` pool
- Artifact data file + richer artifact effects when run persistence/saves are scoped

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
23. ✅ Add boss node encounters using new boss IDs.
24. ✅ Implement on-death enemy effects.
25. Wire run.collection into buildDeck() and resetMatch() so the deck is always rebuilt from the full run card pool.
26. Extract curse definitions into data/curses.js and have resolveCurse() and resolveMystery() pull from that shared pool.
27. Add one Relic and one Drain support card to data/cards.js as data-only entries (effect text only, no logic yet).
