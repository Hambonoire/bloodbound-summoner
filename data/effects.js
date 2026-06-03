createEffectSystem({ player, run, encounter, deckSystem, costSystem }) {
    function applyCardEffect(card) {
        if (!card || !card.id) return;

        switch (card.id) {
            case "bf_ritual_01":
                return applyBloodlettingRite(card);
            case "ub_sacrifice_01":
                return applyBoneHarvest(card);
            default:
                if (card.effect) {
                    console.log(`Effect triggered [${card.name}]: ${card.effect}`);
                }
                return;
        }
    }

    function applyBloodlettingRite(card) {
        // Effect text already mentions losing 3 HP as part of the cost;
        // costSystem.payCost() has already applied the HP loss when this runs.
        // Here we just handle the "Gain 5 Blood" part.
        costSystem.gainBlood(5);
        console.log(`[Effect] ${card.name}: Gained 5 Blood after the ritual.`);
    }

    function applyBoneHarvest(card) {
        // Sacrifice cost has already been applied by costSystem.payCost()
        // (last summon on the field). Now resolve the reward.

        // Gain 2 Marrow
        player.marrow += 2;
        console.log(`[Effect] ${card.name}: Gained 2 Marrow. Marrow: ${player.marrow}`);

        // Try to summon one Bone Shard from deck, then discard
        const targetId = "ub_minion_01";

        // Look in deck first
        let index = player.deck.findIndex((c) => c.id === targetId);
        if (index !== -1) {
            const shard = player.deck.splice(index, 1)[0];
            player.field.push(shard);
            console.log(
                `[Effect] ${card.name}: Summoned ${shard.name} from deck. Field size:
        ${player.field.length}`,
            );
            return;
        }

        // Then look in discard
        index = player.discard.findIndex((c) => c.id === targetId);
        if (index !== -1) {
            const shard = player.discard.splice(index, 1)[0];
            player.field.push(shard);
            console.log(
                `[Effect] ${card.name}: Summoned ${shard.name} from discard. Field size:
        ${player.field.length}`,
            );
            return;
        }

        console.log(
            `[Effect] ${card.name}: No Bone Shard found in deck or discard to summon.`,
        );

        return {
            applyCardEffect,
        };
    }

}

module.exports = {createEffectSystem};