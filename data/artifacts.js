// data/artifacts.js

// Data-only artifact definitions for now. Effects are descriptive text.
// Later, artifact passives can be hooked into combat, map, or economy systems.
const artifacts = [
  {
    id: "artifact_blood_chalice",
    name: "Chalice of Coagulated Blood",
    effect:
      "At the start of each combat, gain 2 Blood. When you cross a Pain milestone, heal 1 HP.",
  },
  {
    id: "artifact_bone_totem",
    name: "Totem of Restless Bone",
    effect:
      "When you win a combat, add a random Undead/Bone minion to your collection.",
  },
];

function getArtifactById(id) {
  return artifacts.find((a) => a.id === id) || null;
}

module.exports = {
  artifacts,
  getArtifactById,
};
