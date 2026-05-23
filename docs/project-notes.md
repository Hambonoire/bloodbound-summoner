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

---

## Known Issues / Dev Notes

- `ub_minion_03` (Grave Crawler): on-death effect references Bone Shard by name. Must resolve to `ub_minion_01` by ID when effect logic is implemented.
- `payCost()`: sacrifice currently targets the last summon(s) on the field. Player choice of sacrifice target is a TODO for when UI is added.
- `applyEffect()`: effects are string-logged only. Full effect resolution system is a future task.
- `canAfford()`: blocks play if HP cost would reduce player to 0 or below. Death-on-cost edge case may need revisiting depending on desired lethality.
- `triggeredMilestones` is a module-level Set — must be reset on match start when match reset logic is implemented (task ties into Pain meter reset rule).
- `gainBlood()` reads `player.painZone` before `updatePainZone()` sets it. Blood gain on the damage that crosses the threshold fires at the old rate. Intentional for now — revisit if it feels wrong during testing.
- Enemy `intent` is a static string for now. Dynamic intent selection (cycling, conditional, weighted random) is a TODO for the combat loop.
- `enemyAttack()`: blocker is selected by highest defense automatically. Player choice of which summon defends is a TODO for when UI is added.
- `attackEnemy()` is called manually for now — no targeting system yet. Player picks which enemy to attack by passing enemyId directly.
- `resetMatch()`: deck is not reshuffled here — no draw system exists yet. When draw/deck logic is implemented, resetMatch() will need to rebuild player.deck from the run's full card pool and shuffle it.
- `offerPackRewards()`: currently offers 2 archetype packs of the same archetype. When multiple archetypes are in the run pool, this should offer one pack per available archetype. TODO when second archetype is added.
- `run.collection` holds all acquired cards but doesn't yet feed into player.deck. Will need a shuffle + deal step when draw system is built.
- Act 1 map is hardcoded for now. Procedural or semi-random map generation is a future consideration once the node structure is proven.
- `run.discoveredHints` tracks hints per run. Cross-run hint persistence will need a save/storage system — pinned for when save state is scoped.
- `buildDeck()` requires run.collection to be populated before it's called. Calling resetMatch() on a fresh run with an empty collection will deal an empty hand. Starting deck composition (task list open question) needs to be resolved and seeded into run.collection before the first match.
- Shop inventory pools from Minion + Warrior tier only. When Champion and Apex cards are added (task 16), shop should weight by act — Act 1: Minion/Warrior only, Act 2: add Champion, Act 3: add Apex. Pass current act into generateShopInventory() when that's implemented.

---

## Pinned for Later

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic
- Conditional branching path unlock requirements
- Gatekeeper artifact requirement specifics
- Additional archetypes: Demonic/Infernal, Void/Eldritch, Bound/Shackled
- Grunt/Soldier random targeting: low-tier enemies select attack targets randomly (player field or player directly) rather than always hitting the highest defense blocker. Trigger condition: enemy attack exceeds the defense of at least one field summon, or enemy has a direct damage effect. Adds chaos and risk to horde encounters.
- Secret archetype unlock: additional archetypes (Demonic/Infernal, Void/Eldritch, Bound/Shackled) are locked behind a secret objective spanning multiple runs. Hints are scattered across hidden secret nodes throughout Act 1. The player must discover all hints across separate runs before the unlock condition is met. Design specifics TBD when second archetype is scoped.

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
14. Ritual, Rest, Curse, Mystery node resolution
15. Gatekeeper artifact check
16. Champion + Apex tier cards for both archetypes
