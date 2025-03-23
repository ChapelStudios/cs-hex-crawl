//import { prettyPrintJson } from "../HexCrawl/repos/foraging.tests.js";

globalThis.Roll = class {
  constructor(formula) {
    this.formula = formula;
  }

  async roll() {
    console.log(`Formula: ${this.formula}`); // Debugging log

    if (this.formula === 0 || this.formula === "0") {
      console.log('Formula is 0'); // Debugging log
      return Promise.resolve({ total: 0 });
    }

    // Check if the formula is a valid dice notation before proceeding
    const diceNotationPattern = /(\d+)d(\d+)(?: \+ (\d+))?(?: \* (\d+))?/;
    const match = this.formula.match(diceNotationPattern);
    console.log('Match:', match); // Debugging log

    if (!match) {
      throw new Error(`Invalid roll formula: ${this.formula}`);
    }

    const numberOfDice = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const bonus = parseInt(match[3], 10);

    // Simulate the roll
    let total = 0;
    for (let i = 0; i < numberOfDice; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }

    // Add the bonus
    total += bonus;

    // Return the result
    return Promise.resolve({ total });
  }
};
