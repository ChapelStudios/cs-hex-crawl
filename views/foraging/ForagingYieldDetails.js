// import { getPartyCarryLoads, isPartyToken } from "../../repos/gameSettings";
// import { getProvisions } from "../../repos/provisions";

//import { moduleBasePath } from "../../constants/paths";

// const exampleData = {
//   name: "None", // should Main title of element when launched, bold top center of design
//   moveCost: 0, // should be displayed in upper left
//   isComplete: true, // we need an overlay of the icon that will be a check mark with a transparant background that gets displayed over the below icon field
//   isImmediate: true, // ignore
//   description: "There is no Terrain Event here", // under the icon and name
//   locale: "bog, lake", // a list in small letters in the upper right
//   duration: null, //ignore
//   survivalCheck: { // this should be an image of a dice (that I can add the loc to later) with the words "Survival Check" near it with the total. if this part is hovered, there should be a small box with all of the roll details
//     leadForager: highestKey,
//     leadResult: highestTotal,
//     assists: 0,
//     hindrences: 0,
//     assistBonus,
//     total: assistBonus + highestTotal,
//   },
//   icon: 'fishing.png', // should be front and center 12rem square
//   yield: { // name in bold
//     name: "",
//     foodUnits: 0,
//     foodWeight: 0,
//     medicine: 0,
//     spices: 0,
//   }, // food unit manipulation is the important part of this form.
//   // we want to have a field for the food units from the yield as well as a non editable one for data that come from the party.
//   // users should be able to use the interface to move foodUnits, spices and medicine - using either a move all type button or manually entering a number to move
//   // the resulting amounts to be added to the party inventory should be tracked as acceptedYield
//   partyInv: {
//     name: "party name",
//     id: "partyId",
//     foodUnits: 0,
//     foodweight: 0,
//     heavyLoad: 0, // this number should be off to the side some as a note
//     medicine: 0,
//     spices: 0,
//     currentLoad: 0, // if this number goes above heavyLoad make it bold
//     // these last two wont exist in the data but should rather be calculated on the fly as food units are added to the party inventory
//     estimatedFoodWeight: 0, // formula: ((partyInv.foodUnits * partyInv.foodweight) + (acceptedYield.foodUnits * acceptedYield.foodweight)) / (partyInv.foodUnits + acceptedYield.foodUnits)
//     estimatedLoad: 0 // formula: ()
//   },
// }

// const exampleReturnObject = {
//   partyId: {
//     foodUnits: 0,
//     foodweight: 0,
//     medicine: 0,
//     spices: 0,
//   },
//   moveCost: 0,
// };

//const localPath = (file) => `${moduleBasePath}views/foragingYieldDetails/${file}`;

// class ForagingYieldDetails extends FormApplication {
//   constructor(token, foragingResult, options) {
//     super(token, options);
//     this.#foragingResult = foragingResult;
//   }

//   #foragingResult;

//   static get defaultOptions() {
//     return mergeObject(super.defaultOptions, {
//       title: "Foraging Yield Details",
//       template: localPath("foragingYieldDetails.hbs"),
//       classes: ["foraging-yield-details"],
//       width: 400,
//       height: "auto",
//       closeOnSubmit: true
//     });
//   }

//   getData() {
//     const existingProvisions = getProvisions(this.object);
//     //const tokenType = getTokenType(this.object);
//     const isParty = isPartyToken(this.object);
//     const partyLoadLimits = isParty
//       ? getPartyCarryLoads(this.object)
//       : null;

//     return {
//       ...this.#foragingResult,
//       partyLoadLimits,
//       partyInv: {
//         name: this.object.name,
//         id: this.object.id,
//         foodUnits: existingProvisions.foodUnits,
//         foodweight: existingProvisions.foodWeight,
//         medicine: existingProvisions.medicine,
//         spices: existingProvisions.spices,
//         currentLoad: existingProvisions.currentLoad,
//       },
//     }
//   }

//   activateListeners(html) {
//     super.activateListeners(html);
//     // Dynamically add CSS file
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href = localPath("foragingYieldDetails.css");
//     document.head.appendChild(link);

//     // Add any additional event listeners here
//     html.find('.food-units-input').on('input', this._updateTotal.bind(this));
//     html.find('.spices-input').on('input', this._updateTotal.bind(this));
//     html.find('.medicine-input').on('input', this._updateTotal.bind(this));
//   }

//   _updateTotal() {
//     // Code to dynamically update estimated food weight and load
//   }

//   _updateObject(event, formData) {
//     // Process the form data and return the updated object
//     const acceptedYield = {
//       foodUnits: parseInt(formData['acceptedYield.foodUnits']) || 0,
//       foodweight: this.data.yield.foodWeight,
//       medicine: parseInt(formData['acceptedYield.medicine']) || 0,
//       spices: parseInt(formData['acceptedYield.spices']) || 0,
//     };

//     const partyInv = this.data.partyInv;
//     partyInv.foodUnits += acceptedYield.foodUnits;
//     partyInv.foodweight = acceptedYield.foodweight; // This needs to be recalculated

//     const updatedData = {
//       partyId: {
//         foodUnits: partyInv.foodUnits,
//         foodweight: partyInv.foodweight,
//         medicine: partyInv.medicine + acceptedYield.medicine,
//         spices: partyInv.spices + acceptedYield.spices,
//       },
//       moveCost: this.data.moveCost,
//     };

//     console.log(updatedData);
//     return updatedData;
//   }
// }

// export const launchForagingYieldDetails = (token, foragingResult) => {
//     const detailsApp = new ForagingYieldDetails(token, foragingResult);
//     detailsApp.render(true);
// }
