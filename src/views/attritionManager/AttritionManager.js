import { circumstances, defaultConditionIds, defaultConditions } from "../../constants/attrition/circumstances.js";
import { bonusTypes } from "../../constants/campActions/checkOnFaction.js";
import { moduleCodePath } from "../../constants/paths.js";
import { getAttitudeAfterShift } from "../../factions/factionInfo.js";
import {
  getFactionData,
  getFactionDataById,
  getFactionPopulationTotals,
  getFactionRepById,
  healInfirm,
  removeInfirmOrGeneral,
  updateFactionRep
} from "../../factions/factions.js";
import { loadStylesheet, registerPartial } from "../../helpers/display.js";
import { performFreeCampForage } from "../../repos/foraging.js";
import { getCurrentDay } from "../../repos/gameClock.js";
import {
  getAttritionBonusInfo,
  getAttritionConditionInfo,
  getCampToken,
  saveAttritionBonusInfo,
  saveAttritionConditionInfo
} from "../../repos/gameSettings.js";
import { getProvisions, updateProvisions } from "../../repos/provisions.js";

const localPath = (file) => `${moduleCodePath}views/attritionManager/${file}`;
const partialPath = (partial) => localPath(`partials/${partial}.hbs`);

// Register partials
const steps = [
  { stepIndex: 0, name: "Nightly Foraging", partial: "nightlyForaging" },
  { stepIndex: 1, name: "Food Upkeep", partial: "foodUpkeep" },
  { stepIndex: 2, name: "Medicine Upkeep", partial: "medicineUpkeep" },
  { stepIndex: 3, name: "Conditions Overview", partial: "conditions" },
  { stepIndex: 4, name: "Health Management", partial: "healthManagement" },
  { stepIndex: 5, name: "Resolve Attrition", partial: "attrition" },
  { stepIndex: 6, name: "Faction Standing", partial: "factionStanding" },
];

await Promise.all(steps.map(step => registerPartial(partialPath(step.partial), step.partial)));

class AttritionManager extends FormApplication {
  constructor(scene, data, options) {
    super(scene, options);
    this.currentDay = data.currentDay;
    this.circumstances = data.circumstances || [];
    this.bonuses = getAttritionBonusInfo(scene).filter(b => b.value && !b.wasApplied);
    this.campToken = data.campToken;
    this.hasAppliedMedicine = false;
    this.hasConsumedFood = false;
    this.conditions = getAttritionConditionInfo(scene) 
    if (!this.conditions.length) {
      this.conditions = foundry.utils.deepClone(defaultConditions);
      saveAttritionConditionInfo(this.object, this.conditions);
    }

    // Info for each section
    // foraging
    this.foragingResults = null;
    this.nightlyForageBonus = 0;

    this.healingMessage = null;
    this.attritionDetails = [];
    this.factionStandingResults = {};
    loadStylesheet(localPath("attritionManager.css"));

    // Step setup
    this.steps = steps;
    this.currentStepIndex = 0;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: localPath("attritionManager.hbs"), // Main template
      title: "Attrition Manager",
      resizable: true,
      height: (canvas.screenDimensions?.[1] ?? 600) * 0.65,
      width: (canvas.screenDimensions?.[0] ?? 800) * 0.5,
    });
  }

  async updateConditionStreak(conditionId, streakChange = 1) {
    const existingCondition = this.conditions.find(condition => condition.id === conditionId);
    if (!existingCondition) {
      console.warn(`Condition with ID ${conditionId} not found.`);
      ui.notifications.error(`Condition with ID ${conditionId} not found.`);
      return;
    }

    existingCondition.streak = Math.max(existingCondition.streak + streakChange, 0);
    await saveAttritionConditionInfo(this.object, this.conditions);
  }

  async resetConditionStreak(conditionId) {
    const existingCondition = this.conditions.find(c => c.id === conditionId);
    if (existingCondition) {
      existingCondition.streak = 0;
      await saveAttritionConditionInfo(this.object, this.conditions);
    }
  }

  async addNewCondition(newCondition) {
    this.conditions.push(newCondition);
    await saveAttritionConditionInfo(this.object, this.conditions);
  }

  getData() {
    const populationTotals = getFactionPopulationTotals(this.object);
    const provisions = getProvisions(this.campToken);

    this.nightlyForageBonus = this.bonuses.reduce(
      (total, bonus) => bonus.type === bonusTypes.nightlyForageBoost
        ? total + bonus.value
        : total,
      0
    );

    const hasPreviousStep = this.currentStepIndex > 0;
    const hasNextStep = this.currentStepIndex < this.steps.length - 1;
    return {
      provisions,
      populationTotals,
      showMedicine: provisions.medicine || this.hasAppliedMedicine,
      conditions: this.conditions,
      nightlyForageBonus: this.nightlyForageBonus,
      foragingResults: this.foragingResults,
      forageDisabled: !!this.foragingResults,
      healingMessage: this.healingMessage,
      factionStandingResults: this.factionStandingResults,
      currentStepIndex: this.currentStepIndex,
      steps: this.steps.map((step, index) => ({
        ...step,
        isActive: index === this.currentStepIndex,
      })),
      hasPreviousStep,
      hasNextStep,
      hasConsumedFood: this.hasConsumedFood,
      attritionDetails: this.attritionDetails,
      factions: getFactionData(this.object),
    };
  }

  _addBonus(bonus) {
    this.bonuses.push(bonus);
    saveAttritionBonusInfo(this.object, this.bonuses);
  };

  activateStep(stepIndex) {
    this.currentStepIndex = stepIndex;
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Navigation Buttons
    html.find(".step-prev").click(() => {
      this.activateStep(Math.max(0, this.currentStepIndex - 1));
    });
    html.find(".step-next").click(() => {
      this.activateStep(Math.min(this.steps.length - 1, this.currentStepIndex + 1));
    });

    // Direct Step Buttons
    html.find(".step-button").click((event) => {
      const stepIndex = parseInt(event.target.dataset.step, 10);
      this.currentStepIndex = stepIndex;
      this.render(true);
    });

    // Handle Nightly Foraging button click
    html.find(".perform-forage").click(async () => {
      const scene = this.object;
      const bonuses = this.bonuses;

      // Fetch the Nightly Forage bonus and mark it as applied
      const nightlyForageBonuses = this.bonuses.filter(b => b.type === bonusTypes.nightlyForageBoost);
      const extraBonus = nightlyForageBonuses.reduce((total, b) => total + b.value, 0);

      if (nightlyForageBonuses.length > 0) {
        nightlyForageBonuses.forEach(bonus => bonus.wasApplied = true);
        await saveAttritionBonusInfo(this.object, bonuses);
      }

      // Call the forage function
      this.foragingResults = await performFreeCampForage(scene, extraBonus);
      
      const baseBonus = {
        type: bonusTypes.foodFound,
        value: this.foragingResults.foodUnits,
        category: null,
        wasApplied: false,
        origination: {
          activity: "nightlyCampForage",
          performer: "GM",
        },
        createdDay: this.currentDay,
      };

      this._addBonus(baseBonus);

      console.log("Forage Results:", this.forageResults);
      console.log("Bonus Applied:", this.nightlyForageBonus);
      this.render(true);
    });

    // Handle Rationing change
    const foodToBeConsumedField = html.find("#food-to-be-consumed");
    const rationingInput = html.find("#rationing");
    const rationingFactor = parseFloat(rationingInput.val()) || 1;
    const rationingCheckBox = html.find("#condition-daysOfRationing");
    rationingCheckBox.prop("disabled", true);
    rationingCheckBox.prop("checked", rationingFactor < 1);
    rationingInput.change(async () => {
      const totalPopulation = getFactionPopulationTotals(this.object).total;
      const availableFood = getProvisions(this.campToken).foodUnits;
      const rationingFactor = parseFloat(rationingInput.val()) || 1;
      const foodToBeConsumed = Math.min(availableFood, Math.ceil(totalPopulation * rationingFactor));
      foodToBeConsumedField.val(foodToBeConsumed);
      rationingCheckBox.prop("checked", rationingFactor < 1);
    });

    // Handle Consume Food button click
    html.find(".consume-food").click(async () => {
      const foodToBeConsumed = parseInt(foodToBeConsumedField.val(), 10);
      const rationingFactor = parseFloat(rationingInput.val()) || 1;
      if (rationingFactor < 1) {
        this.updateConditionStreak({ id: defaultConditionIds.daysOfRationing, streak: 1 });
      }
  
      // Deduct food and update provisions
      const provisions = getProvisions(this.campToken);
      const consumedFood = Math.min(foodToBeConsumed, provisions.foodUnits);
      const remainingFood = provisions.foodUnits - consumedFood;
      await updateProvisions(this.campToken, {
        foodUnits: remainingFood,
      });

      if (consumedFood !== foodToBeConsumed) {
        this.updateConditionStreak({ id: defaultConditionIds.foodFoundYesterday, streak: 1 });
      }
  
      // Update UI
      html.find(".food-consumed-container").removeClass("hidden");
      html.find("#rationing").prop("disabled", true);
      this.hasConsumedFood = true;

      // Log
      console.log(`Food Consumed: ${foodToBeConsumed}`);
      console.log(`Remaining Food Units: ${remainingFood}`);

      this.render(true);
    });

    // Handle Medicine Consumption button click
    const medicineField = html.find("#medicine-consumed");
    html.find(".consume-medicine").click(async () => {
      const provisions = getProvisions(this.campToken);
      if (provisions.medicine < 1) {
        return;
      }
      const totalInfirm = getFactionPopulationTotals(this.object).infirm;

      // Check if any applicable bonus exists
      const bonus = this.bonuses.find(b => b.type === bonusTypes.medicineBoost);
      let medicineNeeded = totalInfirm;

      if (bonus) {
        // Apply the bonus (halves the medicine needed)
        medicineNeeded = Math.floor(medicineNeeded / 2);
  
        // Decrement the bonus value and mark as applied if it hits zero
        bonus.value -= 1;
        if (bonus.value <= 0) {
          bonus.wasApplied = true;
        }
        await saveAttritionBonusInfo(this.object, this.bonuses);
      }

      const medicineConsumed = Math.min(medicineNeeded, provisions.medicine);
      const remainingMedicine = Math.max(0, provisions.medicine - medicineConsumed);

      // bonus for all infirm getting medicine
      const infirmGotMedsCheckBox = html.find("#condition-infirmRecievedMedicine");
      if (medicineConsumed === medicineNeeded) {
        this.updateConditionStreak({ id: defaultConditionIds.infirmRecievedMedicine, streak: 1 });
        infirmGotMedsCheckBox.prop("checked", true);
      }
      else {
        this.resetConditionStreak(defaultConditionIds.infirmRecievedMedicine);
        infirmGotMedsCheckBox.prop("checked", false);
      }

      await updateProvisions(this.campToken, {
        medicine: remainingMedicine,
      });
      this.hasAppliedMedicine = true;

      // Update UI
      medicineField.val(medicineConsumed);
      console.log(`Medicine Consumed: ${medicineConsumed}`);
      console.log(`Remaining Medicine: ${remainingMedicine}`);
      console.log(`Updated Bonus:`, bonus);
      this.render(true);
    });

    // Handle condition checkboxes
    html.find(".condition-checkbox").change((event) => {
      const elementId = $(event.target).attr("id");
      const conditionId = elementId.split("-")[1];
      const condition = this.conditions.find(c => c.id === conditionId);
      if (condition) {
        condition.value = event.target.checked;
        let streak = condition.value ? 1 : -1;
        this.updateConditionStreak(conditionId, streak);
        this.render(true);
      }
    });
    html.find(".reset-conditions").click(async (event) => {
      this.conditions = foundry.utils.deepClone(defaultConditions);
      await saveAttritionConditionInfo(this.object, this.conditions);
      this.render(true);
    });

    // Handle Health Section
    const infirmGotMedsCheckBox = html.find("#condition-infirmRecievedMedicine");
    infirmGotMedsCheckBox.prop("disabled", true);
    infirmGotMedsCheckBox.prop("checked", rationingFactor < 1);
    html.find(".perform-healing").click(async () => await this.checkForRecovery());

    // Handle Resolve Nightly Attrition button click
    html.find(".resolve-nightly-attrition").click(async () => {
      const attritionResults = await this.calculateAttrition(this.object);
      const removalResults = await removeInfirmOrGeneral(this.object, attritionResults.totalDeaths);
      const results = mergeAttritionAndRemovals(attritionResults, removalResults);
      console.log("Attrition Results:", results);

    
      this.attritionDetails = results;
      // Re-render to display the updated message
      this.render(true);
    });

    html.find(".update-faction-standings").click(async (event) => {
      const factionId = event.currentTarget.dataset.faction;
      await this.calculateDeclineChance(factionId);
      this.render(true);
    });
  }

  async checkForRecovery() {    
    const populationTotals = getFactionPopulationTotals(this.object);
    const infirmCount = populationTotals.infirm;

    // Calculate guaranteed healing
    const infirmHealedBonuses = this.bonuses.filter(b => b.type === bonusTypes.infirmHealed);
    const baseHealedGuaranteed = infirmHealedBonuses.reduce((total, bonus) => total + bonus.value, 0);

    // Mark bonuses as applied
    if (infirmHealedBonuses.length > 0) {
      infirmHealedBonuses.forEach(bonus => bonus.wasApplied = true);
      await saveAttritionBonusInfo(this.object, this.bonuses);
    }

    // Determine additional healing
    const maxAdditionalHealed = Math.ceil(infirmCount * 0.15);
    let healedWithChance = 0;
    // Determine condition modifiers
    let healingChance = 0.15;
    const infirmMedicine = this.conditions.find(c => c.id === "infirmRecievedMedicine");
    const rationing = this.conditions.find(c => c.id === "daysOfRationing");
    const open = this.conditions.find(c => c.id === "outInTheOpen");
    const campfires = this.conditions.find(c => c.id === "noCampfires");
    if (infirmMedicine) healingChance += 0.05 * infirmMedicine.streak;
    if (rationing) healingChance -= 0.05 * rationing.streak;
    if (open) healingChance -= 0.05 * open.streak;
    if (campfires) healingChance -= 0.05 * campfires.streak;

    for (let i = 0; i < maxAdditionalHealed; i++) {
      if (Math.random() <= healingChance) {
        healedWithChance++;
      }
    }
    console.log(`Guaranteed Healed: ${baseHealedGuaranteed}, With Chance: ${healedWithChance}`);

    const totalHealed = Math.min(baseHealedGuaranteed + healedWithChance, infirmCount);
    const healingResults = await healInfirm(this.object, totalHealed);
    // Create a detailed message using healingResults
    this.healingMessage = `${healingResults.healed} infirm were healed today! 
      - ${healingResults.addedToWarriors} became warriors. 
      - ${healingResults.addedToForagers} became foragers. 
      - ${healingResults.addedToRefugees} became refugees.`;

    console.log("Healing Results:", healingResults);

    this.render(true);
  }

  async calculateAttrition() {
    let totalDeaths = 0;
    let diceNotation = "";
    const details = [];

    // Helper to build the dice notation string
    const appendDiceNotation = (currentNotation, diceToAdd) =>
      currentNotation ? `${currentNotation} + ${diceToAdd}` : diceToAdd;
  
    // Combined logic for outInTheOpen and noCampfires
    const outInTheOpen = this.conditions.find(c => c.id === "outInTheOpen" && c.value);
    const noCampfires = this.conditions.find(c => c.id === "noCampfires" && c.value);
  
    if (outInTheOpen) {
      const chance = noCampfires ? 1.0 : 0.8; // 100% if both are active, 80% otherwise
      const degreeOfAttrition = noCampfires ? "4d10" : "2d10"; // Double attrition if no campfires
  
      if (Math.random() <= chance) {
        diceNotation = appendDiceNotation(diceNotation, degreeOfAttrition);
        details.push({
          condition: "Out in the open without cover" + (noCampfires ? " and no campfires" : ""),
          diceAdded: degreeOfAttrition,
          explanation: noCampfires
            ? "No campfires increased chance to 100% and doubled attrition degree."
            : "Out in the open triggered 80% chance of attrition.",
        });
      }
    }
  
    // Evaluate other conditions independently
    const conditionsToEvaluate = this.conditions.filter(condition => {
      return condition.value && ["daysOfRationing", "didCampMoveToday", "combatPanic"].includes(condition.id);
    });
    conditionsToEvaluate.forEach(async (condition) => {
      let chance = 0;
      let degreeOfAttrition = "";

      switch (condition.id) {
        case "daysOfRationing":
          chance = 0.2 * condition.streak; // Cumulative 20% per day
          degreeOfAttrition = await new Roll("1d10").roll();
          const baseBonus = {
            type: bonusTypes.refugeeDeaths,
            value: degreeOfAttrition,
            category: null,
            wasApplied: false,
            origination: {
              activity: "attrition",
              performer: "GM",
            },
            createdDay: this.currentDay,
          };
          this.bonuses.push(baseBonus);
          await saveAttritionBonusInfo(this.object, this.bonuses);
          break;
        case "didCampMoveToday":
          chance = 0.6; // 60% chance
          degreeOfAttrition = "1d10";
          break;
        case "combatPanic":
          chance = 1.0; // 100% chance
          degreeOfAttrition = "4d10";
          break;
      }

      if (Math.random() <= chance) {
        diceNotation = appendDiceNotation(diceNotation, degreeOfAttrition);
        details.push({
          condition: condition.name,
          diceAdded: degreeOfAttrition,
          explanation: `Condition '${condition.name}' triggered a chance of ${Math.round(chance * 100)}%.`,
        });
      }
    });
  
    if (diceNotation) {
      const roll = await new Roll(diceNotation).roll();
      totalDeaths += roll.total;
      details.push({
        condition: "Total",
        diceAdded: diceNotation,
        explanation: `The dice rolls resulted in ${totalDeaths} total deaths.`,
      });
    }
  
    // Return the final results
    return {
      totalDeaths,
      diceNotation,
      details,
    };
  }

  async calculateDeclineChance(factionId) {
    const faction = getFactionDataById(this.object, factionId);
    if (!faction) {
      console.warn(`Faction with ID ${factionId} not found.`);
      ui.notifications.error(`Faction with ID ${factionId} not found.`);
      return;
    }

    let declineChance = 0; // Base chance
    const conditionModifiers = [];
  
    // Example of integrating conditions
    const factionContactedBonuses = this.bonuses.filter(c => c.type === "factionWasContacted" && c.category === faction.id);
    if (!factionContactedBonuses.length) {
      declineChance += 10; // +10% for no Diplomacy check
      conditionModifiers.push("No faction contact: +10%");
    }
    else {
      factionContactedBonuses.forEach(bonus => bonus.wasApplied = true);
    }
  
    // const campToken = getCampToken(this.object);
    // const currentDay = getCurrentDay(campToken);
    const wildernessDays = this.conditions.find(c => c.id === "outInTheOpen" && c.value)?.streak || 0;
    if (wildernessDays > 0) {
      const wildernessModifier = wildernessDays * 5; // +5% per day
      declineChance += wildernessModifier;
      conditionModifiers.push(`Days in wilderness (${wildernessDays}): +${wildernessModifier}%`);
    }
  
    // breaking camp early
    if (!this.conditions.find(c => c.id === "breakCamp" && c.value)) {
      declineChance += 10; // +10% for breaking camp
      conditionModifiers.push("Breaking camp: +10%");
    }
  
    const forcedMarchBonuses = this.bonuses.filter(c => c.id === "forcedMarch"); //?.value || 0;
    if (forcedMarchBonuses.length) {
      const hoursOfForcedMarch = forcedMarchBonuses.reduce((total, bonus) => {
        bonus.wasApplied = true;
        return total + bonus.value;
      }, 0);
      if (hoursOfForcedMarch > 0) {
        const marchModifier = hoursOfForcedMarch * 5; // +5% per extra hour
        declineChance += marchModifier;
        conditionModifiers.push(`Forced march for ${hoursOfForcedMarch} hours: +${marchModifier}%`);
      }
    }
    // need to do forced march
  
    if (this.conditions.find(c => c.id === "dragonArmyCombat" && c.value)) {
      declineChance += 10; // +10% for Dragonarmy combat
      conditionModifiers.push("Dragonarmy combat: +10%");
    }
  
    const deathsAndDismemberments = this.bonuses.filter(c =>
      c.type === bonusTypes.refugeeDeaths
      || c.type === bonusTypes.newlyInfirmed
    );
    if (deathsAndDismemberments.length) {
      deaths = deathsAndDismemberments.reduce((total, bonus) => {
        bonus.wasApplied = true;
        return total + bonus.value;
      }, 0);
      declineChance += deaths; // +1% per death or dismemberment
      conditionModifiers.push(`Refugee deaths (${deaths}): +${deaths}%`);
    }
  
    const foodShortage = this.conditions.find(c => c.id === "daysOfRationing" && c.value)
      || this.conditions.find(c => c.id === "inadequateFood" && c.value);
    if (foodShortage) {
      declineChance += 20; // +20% if food shortage;
      conditionModifiers.push("Food shortage: +20%");
    }

    if (this.conditions.find(c => c.id === "standardCombat" && c.value)) {
      declineChance += 5; // +10% for Dragonarmy combat
      conditionModifiers.push("Dragonarmy combat: +10%");
    }

    const violentInteractions = this.bonuses.filter(c => c.type === bonusTypes.violentInteraction && c.category === faction.id);
    if (violentInteractions.length) {
      declineChance += 50; // +50% for violence against council
      violentInteractions.forEach(bonus => bonus.wasApplied = true);
      conditionModifiers.push("Violence against Leadership Council: +50%");
    }
  
    const intimidationInteractions = this.bonuses.filter(c => c.type === bonusTypes.intimidationTactic && c.category === faction.id);
    if (intimidationInteractions.length) {
      declineChance += 30; // +30% for intimidation
      intimidationInteractions.forEach(bonus => bonus.wasApplied = true);
      conditionModifiers.push("Threats to Leadership Council: +30%");
    }
  
    const foundFood = this.bonuses.filter(c => c.type === bonusTypes.foodFound)
      .reduce((total, bonus) => {
        bonus.wasApplied = true;
        return total + bonus.value;
      }, 0);
    const halfOfTotalPopulation = Math.ceil(getFactionPopulationTotals(this.object).total / 2);
    if (foundFood > halfOfTotalPopulation) {
      declineChance -= 10; // -10% for finding food
      conditionModifiers.push(`Food found (${foundFood} units): -10%`);
    }
  
    if (this.conditions.find(c => c.id === "reachedHopefulVale" && c.value)) {
      declineChance -= 20; // -20% for reaching Hopeful Vale
      conditionModifiers.push("Reached Hopeful Vale: -20%");
    }

    // add up additional bonuses gained from camp actions
    const campActionsBonuses = this.bonuses.filter(c => c.type === bonusTypes.factionReputationAdjust)
      .reduce((total, bonus) => {
        bonus.wasApplied = true;
        return total + (bonus.value * -1); // -1% per bonus
      }, 0);
    if (campActionsBonuses > 0) {
      declineChance -= campActionsBonuses; // -1% per bonus
      conditionModifiers.push(`Gained addition bonuses from other sources: -${campActionsBonuses}%`);
    }

    const startingAttitude = getFactionRepById(this.object, faction.id);
    const factionChangeRoll = (await new Roll("1d100").roll()).total;
    let msg;
    if (factionChangeRoll <= Math.abs(declineChance)) {
      const shift = declineChance < 0 ? 1 : -1;
      const newReputation = getAttitudeAfterShift(startingAttitude, shift, faction.maxRep);
      await updateFactionRep(this.object, faction.id, newReputation);
      msg = `${faction.name}'s attitude towards the Heroes of Pax Tharkas has shifted from ${startingAttitude} to ${newReputation}`;
      declineChance = 0;
    }
    else {
      msg = `${faction.name}'s attitude towards the Heroes of Pax Tharkas has not shifted from ${startingAttitude}`;
    }

    this.factionStandingResults[faction.id] = msg;
  
    return {
      declineChance,
      conditionModifiers,
    };
  }

  async _updateObject(event, formData) {
    // Handle submitted form data here
    console.log("Form Data:", formData);
    console.log("Far Sight Counter:", this.farSightCounter);
  }
}

export const launchAttritionManager = (scene) => {
  const campToken = getCampToken(scene);
  const factionManager = new AttritionManager(scene, {
    campToken,
    circumstances,
    currentDay: getCurrentDay(campToken),
  }).render(true);
  return factionManager;
};

export const mergeAttritionAndRemovals = async (attritionResults, removalResults) => {
  // Step 3: Combine results
  const totalDeaths = attritionResults.totalDeaths + removalResults.removedFromInfirm + removalResults.removedFromTotal;

  // Merge details
  const combinedDetails = [...attritionResults.details];

  // Add removal details to the combined details
  Object.entries(removalResults.distribution).forEach(([factionName, removals]) => {
    combinedDetails.push({
      condition: `Removals in faction ${factionName}`,
      removedFromInfirm: removals.removedFromInfirm || 0,
      removedFromTotal: removals.removedFromTotal || 0,
      explanation: `Removed ${removals.removedFromInfirm || 0} from infirm and ${removals.removedFromTotal || 0} from total population.`,
    });
  });

  // Final result
  return {
    totalDeaths,
    diceNotation: attritionResults.diceNotation, // Retain dice notation for attrition logic
    details: combinedDetails, // Merge attrition and removal details
  };
};
