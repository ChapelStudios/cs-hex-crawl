import { artPath, FoundryD20Icon, moduleCodePath } from "../../constants/paths.js";
import { registerPartial, replaceActorIdsWithNames } from "../../helpers/display.js";
import { forageBountyActionName } from "../../repos/foraging.js";
import { getPartyCarryLoads, isPartyToken } from "../../repos/gameSettings.js";
import { getMoveCost } from "../../repos/moves.js";
import { getProvisions, updateProvisionsActionName } from "../../repos/provisions.js";
import { getHexCrawlDataFromTile, updateForageDataActionName } from "../../repos/tiles.js";
import { dl3HexCrawlSocket } from "../../socket.js";

const localPath = (file) => `${moduleCodePath}views/foraging/${file}`;
const getPartialPath = (partialName) => localPath(`partials/${partialName}.hbs`);

// Generate file paths and register the partials
const partials = [
  'title',
  'detailsRow',
  'iconContainer',
  'survivalCheck',
  'yieldTable',
  'partyInventory',
  'categoryButtons'
];
partials.forEach(partialName => {
  const filePath = getPartialPath(partialName);
  registerPartial(filePath, partialName);
});

class ForagingYieldDetails extends FormApplication {
  constructor(tile, token, options) {
    super(token, options);
    this.#tile = tile;
    
    this.#cost = this.options.isFree
      ? 0
      : getMoveCost(this.#tile, this.token).normalCost;
  }

  #tile;
  #existingProvisions;
  #forageEvent;
  #calculatedFood;
  #cost;

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      title: "Foraging Yield Details",
      template: localPath("foragingYieldDetails.hbs"),
      classes: ["foraging-yield-details"],
      width: 400,
      height: "auto",
      closeOnSubmit: true
    });
  }

  async getData() {
    this.#existingProvisions = getProvisions(this.object);
    const isParty = isPartyToken(this.object);
    const partyLoadLimits = isParty
      ? getPartyCarryLoads(this.object)
      : {
          normalLoad: Infinity,
          heavyLoad: Infinity,
        };
    const hexData = getHexCrawlDataFromTile(this.#tile);
    this.#forageEvent = hexData?.events?.forage;
    // Destructure yield details; note that spices and medicine have no weight
    const {
      yield: {
        foodUnits = 0,
        foodWeight = 0,
        spices = 0,
        medicine = 0
      } = {},
      isForagingComplete
    } = this.#forageEvent;
    
    const totalWeightYield = foodUnits * foodWeight;
    const totalWeightAccepted = 0;
    const totalWeightParty = this.#existingProvisions.foodUnits * this.#existingProvisions.foodWeight;

    const acceptedFoodUnits = this.#existingProvisions.foodUnits;
    const acceptedSpices = this.#existingProvisions.spices;
    const acceptedMedicine = this.#existingProvisions.medicine;

    let columnsCount = 0;
    if (foodUnits) columnsCount += 2;
    if (spices) columnsCount++;
    if (medicine) columnsCount++;

    // New properties: flag & message when all yield is taken.
    const allYieldTaken = this.#forageEvent.isForagingComplete
      && (foodUnits === 0 && spices === 0 && medicine === 0);
    const yieldMessage = allYieldTaken ? "All available yield has been collected!" : null;
    // Disable the forage button for non-GM users after foraging is complete.
    const disableForage = !game.user.isGM && isForagingComplete;
    
    return {
      ...this.#forageEvent,
      totalWeightYield,
      totalWeightAccepted,
      totalWeightParty,
      partyLoadLimits,
      cost: this.#cost,
      partyInv: {
        name: this.object.name,
        id: this.object.id,
        foodUnits: this.#existingProvisions.foodUnits,
        foodWeight: this.#existingProvisions.foodWeight,
        medicine: this.#existingProvisions.medicine,
        spices: this.#existingProvisions.spices,
        currentLoad: this.#existingProvisions.currentLoad,
      },
      checkMarkIcon: artPath('checkmark.png'),
      isPartyDetailShown: isForagingComplete && isParty,
      survivalCheck: await replaceActorIdsWithNames(this.#forageEvent.survivalCheck),
      hasFoodYield: foodUnits > 0,
      hasSpicesYield: spices > 0,
      hasMedicineYield: medicine > 0,
      canAcceptAll: foodUnits > acceptedFoodUnits || spices > acceptedSpices || medicine > acceptedMedicine,
      canUnTakeAll: acceptedFoodUnits > 0 || acceptedSpices > 0 || acceptedMedicine > 0,
      columnsCount,
      allYieldTaken,
      yieldMessage,
      disableForage,
      foundryD20Icon: FoundryD20Icon,
      tokenName: this.object.name,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Dynamically add CSS file
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath("foragingYieldDetails.css");
    document.head.appendChild(link);
  
    // Input event listeners remain unchanged
    html.find('.food-input').on('input', this._updateTotal.bind(this, "foodUnits", html));
    html.find('.spices-input').on('input', this._updateTotal.bind(this, "spices", html));
    html.find('.medicine-input').on('input', this._updateTotal.bind(this, "medicine", html));
    html.find('.dice-btn').on('click', this._performForage.bind(this));
    html.find('.cancel-forage').on('click', this.close.bind(this));
  
    // ------ Unified button naming: "take" instead of "accept" and "return" instead of "un-take"
    // Assign dynamic classes for individual buttons using new naming
    html.find('.take').each(function() {
      const category = $(this).data('category');
      $(this).addClass(`take-${category}`);
    });
    html.find('.return').each(function() {
      const category = $(this).data('category');
      $(this).addClass(`return-${category}`);
    });
  
    // Bind event handlers for individual categories with new CSS selectors
    html.find('.take-food').on('click', this._takeAll.bind(this, "foodUnits", html));
    html.find('.return-food').on('click', this._returnAll.bind(this, "foodUnits", html));
    html.find('.take-spices').on('click', this._takeAll.bind(this, "spices", html));
    html.find('.return-spices').on('click', this._returnAll.bind(this, "spices", html));
    html.find('.take-medicine').on('click', this._takeAll.bind(this, "medicine", html));
    html.find('.return-medicine').on('click', this._returnAll.bind(this, "medicine", html));
  
    // Bind event handlers for the "all" buttons with new naming
    html.find('.take-all').on('click', this._takeAll.bind(this, "all", html));
    html.find('.return-all').on('click', this._returnAll.bind(this, "all", html));
  
    // Ensure buttons are updated correctly based on the current state
    this._updateButtonStates(html);
  }

  _updateButtonStates(html) {
    const foodUnits = parseInt(html.find('input[name="acceptedYield.foodUnits"]').val()) || 0;
    const spices = parseInt(html.find('input[name="acceptedYield.spices"]').val()) || 0;
    const medicine = parseInt(html.find('input[name="acceptedYield.medicine"]').val()) || 0;
  
    this._updateButtonState(html, 'food', foodUnits, this.#forageEvent.yield?.foodUnits ?? 0);
    this._updateButtonState(html, 'spices', spices, this.#forageEvent.yield?.spices ?? 0);
    this._updateButtonState(html, 'medicine', medicine, this.#forageEvent.yield?.medicine ?? 0);
  
    this._updateAllButtonsState(html, foodUnits, spices, medicine);
  }

  _updateButtonState(html, category, currentValue, maxValue) {
    const canTake = currentValue < maxValue;
    const canReturn = currentValue > 0;
  
    if (canTake) {
      html.find(`.take-${category}`).removeAttr('data-disabled');
    } else {
      html.find(`.take-${category}`).attr('data-disabled', true);
    }
  
    if (canReturn) {
      html.find(`.return-${category}`).removeAttr('data-disabled');
    } else {
      html.find(`.return-${category}`).attr('data-disabled', true);
    }
  }
  
  _updateAllButtonsState(html, foodUnits, spices, medicine) {
    const totalUnits = foodUnits + spices + medicine;
    const totalYields = this.#forageEvent.yield?.foodUnits ?? 0
      + this.#forageEvent.yield?.spices ?? 0
      + this.#forageEvent.yield?.medicine ?? 0;
  
    const canTakeAll = totalUnits < totalYields;
    const canReturnAll = totalUnits > 0;
  
    if (canTakeAll) {
      html.find('.take-all').removeAttr('disabled');
    } else {
      html.find('.take-all').attr('disabled', true);
    }
  
    if (canReturnAll) {
      html.find('.return-all').removeAttr('disabled');
    } else {
      html.find('.return-all').attr('disabled', true);
    }
  }

  _takeAll(category, html) {
    if (category === "all") {
      this._takeAll("food", html);
      this._takeAll("spices", html);
      this._takeAll("medicine", html);
      return;
    }
    const maxValue = this.#forageEvent.yield[category === 'food' ? 'foodUnits' : category];
    html.find(`input[name="acceptedYield.${category === 'food' ? 'foodUnits' : category}"]`).val(maxValue);
    this._updateTotal(category, html);
    this._updateButtonStates(html);
  }
  
  _returnAll(category, html) {
    if (category === "all") {
      this._returnAll("food", html);
      this._returnAll("spices", html);
      this._returnAll("medicine", html);
      return;
    }
    html.find(`input[name="acceptedYield.${category === 'food' ? 'foodUnits' : category}"]`).val(0);
    this._updateTotal(category, html);
    this._updateButtonStates(html);
  }
  
  _updateTotal(category, html) {
    const { yield: { foodWeight } } = this.#forageEvent;
    let totalKey = category === 'food' ? 'foodUnits' : category;
  
    const relatedInput = html.find(`input[name="acceptedYield.${totalKey}"]`);
    const amountToAdd = parseInt(relatedInput.val()) || 0;
  
    const existingValue = this.#existingProvisions[totalKey];
    const newTotalValue = existingValue + amountToAdd;
  
    if (category === "food") {
      const currentWeight = this.#existingProvisions.foodWeight;
      const currentCarried = currentWeight * existingValue;
      const acceptedWeight = amountToAdd * foodWeight;
      const newWeightPerUnit = Math.round((currentCarried + acceptedWeight) / newTotalValue);
      const completeTotalWeight = newWeightPerUnit * newTotalValue;
      html.find('.total-weight-accepted-value').text(acceptedWeight);
      html.find('.total-weight-per').text(newWeightPerUnit);
      html.find('.weight-total').text(completeTotalWeight);
  
      totalKey = "food";
  
      this.#calculatedFood = {
        foodUnits: newTotalValue,
        weight: newWeightPerUnit,
        totalWeight: completeTotalWeight,
      }
    }
    html.find(`.${totalKey}-total`).text(newTotalValue);
    this._updateButtonStates(html);
  }
  
  async _updateObject(event, formData) {
    // Process the form data and convert string values to integers
    const acceptedYield = {
      foodUnits: parseInt(formData['acceptedYield.foodUnits']) || 0,
      foodWeight: this.#forageEvent.yield.foodWeight,
      medicine: parseInt(formData['acceptedYield.medicine']) || 0,
      spices: parseInt(formData['acceptedYield.spices']) || 0,
    };
  
    const nothingAccepted =
      acceptedYield.foodUnits === 0 &&
      acceptedYield.medicine === 0 &&
      acceptedYield.spices === 0;
    const knownYield = this.#forageEvent.yield;
    const isParty = isPartyToken(this.object);
  
    if (nothingAccepted && isParty) {
      this.close();
      return;
    }
  
    // Update the actor's provisions depending on the token type
    const updateObj = isParty
      ? {
          foodUnits: this.#calculatedFood?.foodUnits ?? this.#existingProvisions.foodUnits,
          medicine: this.#existingProvisions.medicine + acceptedYield.medicine,
          spices: this.#existingProvisions.spices + acceptedYield.spices,
          foodWeight: this.#calculatedFood?.weight ?? this.#existingProvisions.foodWeight,
          currentLoad: this.#calculatedFood?.totalWeight ?? this.#existingProvisions.currentLoad,
        }
      : {
          foodUnits: this.#existingProvisions.foodUnits + knownYield.foodUnits,
          medicine: this.#existingProvisions.medicine + knownYield.medicine,
          spices: this.#existingProvisions.spices + knownYield.spices,
        };
  
    await dl3HexCrawlSocket.executeAsGM(updateProvisionsActionName, this.object, updateObj);
  
    // Calculate the remaining yield values
    const newUnits = isParty
      ? {
        foodUnits: knownYield.foodUnits - acceptedYield.foodUnits,
        medicine: knownYield.medicine - acceptedYield.medicine,
        spices: knownYield.spices - acceptedYield.spices,
      }
      : {
        foodUnits: 0,
        medicine: 0,
        spices: 0,
      };
  
    // Set the isForagingComplete flag if all yields have been taken
    const isAllYieldTaken =
      newUnits.foodUnits === 0 &&
      newUnits.medicine === 0 &&
      newUnits.spices === 0;
  
    const updatedEvent = {
      ...this.#forageEvent,
      yield: {
        ...knownYield,
        ...newUnits,
      },
      isForagingComplete: isAllYieldTaken,
    };
  
    await dl3HexCrawlSocket.executeAsGM(updateForageDataActionName, this.#tile, updatedEvent);
  }

  async _performForage() {    
    if (!game.user.isGM && this.#forageEvent.isForagingComplete) {
      return;
    }

    await dl3HexCrawlSocket.executeAsGM(forageBountyActionName, this.#tile, this.object, this.#cost);
    
    this.#tile = canvas.tiles.get(this.#tile._id).document;
    // Update the state after performing the forage action.
    this.render(false);
  }

  async close() {
    this.options.onClose();
    super.close({ force: true });
  }
}

export const launchForagingYieldDetails = (tile, token, onClose, isFree = false) => {
    const detailsApp = new ForagingYieldDetails(tile, token, {
      onClose,
      isFree,
    });
    detailsApp.render(true);
}
