import { getFactionData } from "../../factions/factions.js";
import { bonusTypes } from "./checkOnFaction.js";

export const healTheInfirm = {
  id: "healTheInfirm",
  title: "Heal the Infirm",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: true,
  details: `
    <p><em>Requires Heal 1 rank</em></p>
    <p>Players aid in the infirmary by making a healing check:</p>
    <ul>
      <li><strong>4 or Less:</strong> Get kicked out after being less than helpful; Lose 1d4 medicine and some faction standing with a random faction.</li>
      <li><strong>9 or Less:</strong> You weren't helpful, but at least no one noticed.</li>
      <li><strong>10:</strong> 1 Infirm will recover at the end of the day.</li>
      <li><strong>15:</strong> 1d4 + 1 Infirm will recover at the end of the day.</li>
      <li><strong>20:</strong> 2d6 + 4 Infirm will recover at the end of the day.</li>
      <li><strong>25:</strong> 2d12 + 10 Infirm will recover at the end of the day.</li>
      <li><strong>Above 25:</strong> An additional 1d10 Infirm recover for each additional 5 points above 25.</li>
    </ul>
    <p><em>All players perform this task by themselves with separate checks.</em></p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "hea",
      display: "Heal",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
  ],
  resolveBonuses: async ({ checkResult, baseBonus, scene }) => {
    const bonuses = [];
    let infirmHealed = 0;

    if (checkResult < 5) {
      const medicineAdjust = (await new Roll("1d4").roll()).total * -1;
      const factions = getFactionData(canvas.scene);
      const randomIndex = Math.floor(Math.random() * factions.length);
      bonuses.push({
        ...baseBonus,
        type: bonusTypes.factionReputationAdjust,
        value: -10,
        category: factions[randomIndex].id,
      });
      const campToken = getCampToken(scene);
      const existing = getProvisions(campToken);
      await updateProvisions(campToken, {
        medicine: medicineAdjust + existing.medicine,
      });

      bonuses.push({
        ...baseBonus,
        value: `Wasted ${medicineAdjust} medicine.`,
        wasApplied: true
      });
    }
    else if (checkResult < 10) {
      // do nothing
    }
    else if (checkResult < 15) {
      infirmHealed = 1;
    }
    else if (checkResult < 20) {
      infirmHealed = (await new Roll("1d4 + 1").roll()).total;
    }
    else if (checkResult < 25) {
      infirmHealed = (await new Roll("2d6 + 4").roll()).total;
    }
    else { // checkResult >= 25
      let rollFormula = "2d12 + 10" 
      const excessPoints = checkResult - 25;
      const bonusDice = Math.floor(excessPoints / 5);
      if (bonusDice) {
        rollFormula += ` + ${bonusDice}d10`;
      }
      infirmHealed = (await new Roll(rollFormula).roll()).total;
    }

    if (infirmHealed) {
      bonuses.push({
        ...baseBonus,
        type: bonusTypes.infirmHealed,
        value: infirmHealed,
      });
    }

    return bonuses;
  },
};