<!-- docs/game-design.md -->

# Bloodbound Summoner — Game Design Document

## Core Identity

A masochistic roguelike card game where self-damage, sacrifice, and curses are
resources, not penalties. The player wins by hurting themselves strategically.
There is no safe play. Every run is a desperate gamble.

---

## Archetypes

Two starting archetypes. More to be added as the project grows.

### Blood/Flesh

- **Cost types:** HP costs, Blood pool spending
- **Identity:** Raw power fueled by self-damage. The more you bleed, the
  stronger your summons.

### Undead/Bone

- **Cost types:** Sacrifice (destroy your own summons)
- **Identity:** Death feeds death. Weaker summons are fuel for stronger ones.

---

## Summon Hierarchy

Both archetypes share the same four-tier structure.

| Tier     | Relative Cost | Notes                                       |
| -------- | ------------- | ------------------------------------------- |
| Minion   | Low           | 1–2 HP or discard 1 card                    |
| Warrior  | Medium        | 3–5 HP or sacrifice a Minion                |
| Champion | High          | 5–8 HP + a curse, or sacrifice a Warrior    |
| Apex     | Extreme       | 15 HP + sacrifice a Champion + take a curse |

Apex cards are locked until Pain milestone 20 is reached (see Pain Meter).

---

## Player Stats

| Stat                              | Value                    |
| --------------------------------- | ------------------------ |
| Starting HP                       | 30                       |
| Blood pool max                    | 10                       |
| Blood generation (Cold zone)      | 1:1 with self-damage     |
| Blood generation (Threshold zone) | 2:1 with self-damage     |
| Pain meter cap                    | 40 (hard cap — run ends) |
| Pain meter reset                  | Between matches          |

---

## Resources

### HP

The player's life total. Spending it fuels Blood/Flesh summons and fills the
Pain meter. Reaching 0 ends the run.

### Blood Pool

A spendable resource that fills when the player takes **self-inflicted damage
only**. Enemy damage does not fill the Blood pool. Max capacity: 10. Spent to
summon Blood/Flesh cards.

### Sacrifice

The Undead/Bone resource. Destroy one of your own summons on the field to pay
summoning costs. No pool — it's a direct action.

### Marrow (Currency)

Earned from combat nodes and hidden secrets. Used to:

- Buy cards at shop nodes
- Upgrade existing cards
- Pay entry costs at certain nodes
- Bribe or bypass enemy encounters

---

## Pain Meter

Tracks cumulative **self-inflicted damage only** per match. Resets between
matches.

| Zone      | Range | Effect                                         |
| --------- | ----- | ---------------------------------------------- |
| Cold      | 0–9   | Base stats, 1:1 Blood generation               |
| Threshold | 10–39 | 2:1 Blood generation, milestone unlocks active |
| Broken    | 40    | Hard cap — run ends                            |

### Milestones

| Pain | Unlock                         |
| ---- | ------------------------------ |
| 10   | Blood generation doubles (2:1) |
| 20   | First Apex card unlocks        |
| 30   | All summons gain +1 attack     |
| 40   | Broken — run ends              |

**Pinned for later:**

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse or run mechanic

---

## Support Cards

Non-summon cards. Archetype-locked unless noted as generic.

| Type      | Archetype   | Description                                         |
| --------- | ----------- | --------------------------------------------------- |
| Ritual    | Blood/Flesh | Spend HP or Marrow for an immediate effect          |
| Sacrifice | Undead/Bone | Destroy a summon for an effect                      |
| Curse     | Shared      | Apply a persistent negative effect to self or enemy |
| Hex       | Shared      | Delayed effect, fires on a trigger condition        |
| Relic     | Generic     | Persistent passive that modifies rules              |
| Drain     | Generic     | Target Blood pool — yours or the enemy's            |

### Healing & Drain

Healing exists as both a summon passive and a support card. It is always a
tradeoff:

- Healing the player restores HP but drains the Pain meter
- Healing the enemy is a cost on powerful cards
- Draining the Blood pool is a debuff or card cost

---

## Enemy Structure

### Tiers

| Tier    | Count | HP    | Resources       | Behavior                       |
| ------- | ----- | ----- | --------------- | ------------------------------ |
| Grunt   | 2–3   | 5–10  | None            | Intent system, basic attack    |
| Soldier | 1–2   | 15–20 | Armor           | Intent system, can block       |
| Elite   | 1     | 25–35 | Armor + Rage    | Plays cards from fixed deck    |
| Boss    | 1     | 50+   | Unique mechanic | Plays cards, signature ability |

### Enemy Archetypes

- **Bloodhunter** — deals more damage the lower the player's HP
- **Bonecaller** — sacrifices its own Grunts to heal or summon stronger units
- **Cursebinder** — applies persistent curses to player summons or Blood pool
- **Voidwalker** — drains the player's Blood pool directly

### Boss Rewards

Each boss drops the following on defeat:

| Drop                    | Guaranteed?        | Notes                                       |
| ----------------------- | ------------------ | ------------------------------------------- |
| Archetype Seal artifact | ✅ Act 1 Boss only | Required to pass the Gatekeeper             |
| 1 rare/unique card      | ✅ Always          | Weighted toward next-act tier               |
| Marrow bonus            | ✅ Always          | +3 on top of standard combat Marrow         |
| Rogue pack offer        | 50% chance         | Consistent with standard pack reward system |

Acts 2 and 3 bosses drop the same structure minus the Seal, plus a second rare card slot.

**Pinned for later:** exact loot tables per act; second rare card slot implementation

---

## Run Structure

### Acts

Three acts total. Building Act 1 first; Act 2 stubbed.

Each act ends with a Boss node. Completing all three acts completes the run.

Act progression fires on boss kill — `run.act` increments, boss loot is offered, and the next act's map loads.

### Map

Node-based map inspired by Super Mario World / Cuphead. Branching paths unlock upon clearing the preceding node.

**Node count per act:** 12–15 nodes. Act 1 and Act 2 both use a 15-node structure. Rough ratio per act:

| Node Type      | Count | Notes                                        |
| -------------- | ----- | -------------------------------------------- |
| Combat         | 5–6   | Core loop, primary Marrow source             |
| Shop           | 1–2   | At least one mid-act, one pre-boss           |
| Ritual         | 1     | Voluntary self-damage for a reward           |
| Rest           | 1     | Before Boss                                  |
| Curse          | 1     | Optional pain for a strong card              |
| Combat Mystery | 1–2   | High variance, keeps runs unpredictable      |
| Wanderer (NPC) | 2     | Only visible after Gatekeeper hint is active |
| Gatekeeper     | 1     | Guards act exit; seeds hint_01               |
| Hidden Secret  | 1     | Locked until hint chain resolves             |
| Boss           | 1     | Act-ender                                    |

**Pinned for later:** conditional unlock requirements per branch

### Node Types

| Node           | Description                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combat         | Fight enemies, earn Marrow                                                                                                                                 |
| Shop           | Buy or upgrade cards with Marrow                                                                                                                           |
| Ritual         | Sacrifice HP or a card for a reward                                                                                                                        |
| Curse          | Take a curse, receive a powerful card                                                                                                                      |
| Rest           | Recover HP — drains Pain meter                                                                                                                             |
| Combat Mystery | Unknown enemy composition, rolled at resolve time. High variance — may be an elite, an unusual pair, or a swarm.                                           |
| Wanderer (NPC) | Optional node. Appears only after the Gatekeeper hint is active. Interacting advances the hint chain by one step. May offer minor Marrow.                  |
| Gatekeeper     | Requires your archetype seal (earned on Act 1 boss kill). On first contact, grants hint_01 — the first clue in the Hidden Secret chain.                    |
| Hidden Secret  | Locked until the hint chain is complete. Unlocked by finding both Wanderers and returning to the Gatekeeper. May contain artifacts, Marrow, or rare cards. |

### Map structure

**The current map is mostly linear with two small branch pairs. Here's a redesigned layout with clearer branching identity — each branch has a deliberate personality:**

node_01 (Combat — Entry)
├── node_02 (Ritual) ← Branch A: self-damage / Blood path
└── node_03 (Combat) ← Branch B: straight combat path
↓ both merge →
node_04 (Shop)
├── node_05 (NPC — Wanderer_01) ← Branch C: lore/scavenger path — hint chain step 1
└── node_06 (Combat) ← Branch D: pure combat
↓ both merge →
node_07 (Curse)
├── node_08 (NPC — Wanderer_02) ← Branch E: lore/scavenger path — hint chain step 2
└── node_09 (Combat) ← Branch F: pure combat
↓ both merge →
node_10 (Rest)
├── node_11 (Hidden Secret — unlocks if both hints collected)
└── node_12 (Combat Mystery — act-end pre-boss)
↓ both merge →
node_13 (Gatekeeper — grants hint_01, checks archetype seal)
node_14 (Combat Mystery — act-end escalation)
node_15 (Boss)

### Pack Rewards

After winning a combat node, the player chooses one pack from a randomized
selection of three. Packs come in two categories:

**Archetype Packs**
Locked to a specific archetype. Contains:

- 2–3 summon cards (weighted toward the pack's archetype tier progression)
- 1 archetype-locked support card (Ritual or Sacrifice)
- Possible Marrow bonus

**Rogue Packs**
No archetype lock. Contains:

- 1–2 generic support cards (Relic, Drain, Curse, or Hex)
- 1 rare card drop (low probability — any archetype or generic)
- Possible artifact
- Possible Marrow bonus

The rare card drop in Rogue packs is the primary way to acquire cards outside
your chosen archetype or obtain high-tier cards earlier than expected. High
risk, high reward — consistent with the game's identity.

---

## Pinned — Future Features

- Flexible Broken zone cap as a card effect
- Pain carryover between matches as a curse/run mechanic
- Conditional branching path unlock requirements
- Boss loot tables
- Additional archetypes: Demonic/Infernal, Void/Eldritch, Bound/Shackled
- Requirement stipulations for Gatekeeper nodes
- Act 2 enemy IDs, NPC names/dialogue, and boss identity (currently stubbed with Act 1 placeholders)
- Act 2 Gatekeeper artifact definition and boss-kill grant wiring
- `checkHintChain()` act-aware extension for Act 2 hint IDs
