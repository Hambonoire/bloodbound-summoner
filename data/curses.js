// data/curses.js

// Simple shared curse definitions for Curse and Mystery nodes.
// Data-only for now; effect text is descriptive and logged by node resolvers.
const curses = [
  {
    id: "curse_fragile_blood",
    name: "Fragile Blood",
    effect:
      "Max HP reduced by 3 for this run. Counts as self-harm for Pain theming, but does not trigger Pain milestones directly.",
  },
  {
    id: "curse_clotted_pain",
    name: "Clotted Pain",
    effect:
      "Pain gain from self-damage is reduced by 1 (to a minimum of 0) for the next combat.",
  },
  {
    id: "curse_brittle_bones",
    name: "Brittle Bones",
    effect: "Lose 1 max Blood for this run. Cannot reduce max Blood below 5.",
  },
  {
    id: "curse_blood_debt",
    name: "Blood Debt",
    effect:
      "At the start of each combat, lose 2 HP. This damage counts as self-inflicted.",
  },
];

// Simple helper to pull N random curses from the pool without modifying it.
function drawRandomCurses(count = 1) {
  const shuffled = [...curses].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = {
  curses,
  drawRandomCurses,
};
