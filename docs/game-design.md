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

Each boss drops a treasure chest on defeat. Contents vary by act difficulty:

- Rare or unique cards
- Marrow
- Artifacts
- Possible run modifier

**Pinned for later:** exact loot tables per boss

---

## Run Structure

### Acts

Three acts total. Building Act 1 first.

Each act ends with a Boss node. Completing all three acts completes the run.

### Map

Node-based map inspired by Super Mario World / Cuphead. Branching paths unlock
upon clearing the preceding node.

**Pinned for later:** conditional unlock requirements per branch

### Node Types

| Node          | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| Combat        | Fight enemies, earn Marrow                                                     |
| Shop          | Buy or upgrade cards with Marrow                                               |
| Ritual        | Sacrifice HP or a card for a reward                                            |
| Curse         | Take a curse, receive a powerful card                                          |
| Rest          | Recover HP — drains Pain meter                                                 |
| Mystery       | Unknown outcome, high variance                                                 |
| Gatekeeper    | Requires specific artifacts from prior nodes                                   |
| Hidden Secret | Invisible until node is cleared — may contain artifacts, Marrow, or rare cards |

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
