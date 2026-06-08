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
  {
    id: "artifact_blood_seal",
    name: "Seal of Bound Blood",
    effect:
      "Proof of the Blood/Flesh pact. Required to pass the Warden's Gate. Granted on Act 1 boss kill.",
  },
  {
    id: "artifact_bone_seal",
    name: "Seal of Hollow Bone",
    effect:
      "Proof of the Undead/Bone pact. Required to pass the Warden's Gate. Granted on Act 1 boss kill.",
  },
];

function getArtifactById(id) {
  return artifacts.find((a) => a.id === id) || null;
}

module.exports = {
  artifacts,
  getArtifactById,
};
