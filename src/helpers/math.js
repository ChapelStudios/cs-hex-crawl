import { isFarSightToken, isHexCrawlToken } from "../repos/gameSettings.js";

/**
 * Determines if the given mouse position is within the specified range (in hexes)
 * of any token that passes the custom isHexCrawlToken() check.
 * 
 * @param {{x: number, y: number}} mousePos - The mouse position in scene coordinates.
 * @param {number} [range=3] - The range (in hexes) to check for proximity.
 * @returns {boolean} True if at least one valid token is within the specified range.
 */
export const isWithinRange = (mousePos, range = 1) => {
  // Loop through all placeable tokens on the canvas.
  for (let token of canvas.tokens.placeables) {
    // Only consider tokens that are valid for your hex crawl.
    if (!isHexCrawlToken(token) || isFarSightToken(token)) continue;
    
    // Create a ray from the token's center to the mouse position.
    const ray = new Ray(token.center, mousePos);
    
    // Measure the distance in grid spaces.
    const [distance] = canvas.grid.measureDistances([{ ray }], { gridSpaces: true });
    
    // If the token is within the specified range, return true.
    if (distance <= range) {
      return true;
    }
  }
  
  // No token was close enough.
  return false;
}

export const distanceBetweenPoints = (x1, y1, x2, y2) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

// Utility function to snap movement to one hex distance
export function snapMovementTo1(originalX, originalY, newX, newY, hexSize) {
  const deltaX = newX - originalX;
  const deltaY = newY - originalY;
  const angle = Math.atan2(deltaY, deltaX);
  const snappedX = originalX + Math.cos(angle) * hexSize;
  const snappedY = originalY + Math.sin(angle) * hexSize;
  return canvas.grid.getSnappedPosition(snappedX, snappedY);
};

export const isWithinNumberRange = (min, max, result) => {
  return min <= result && result <= max;
};

const get2DigitString = (number) => number < 10
  ? `0${number}`
  : number;

export const convertToHoursAndMinutes = (hoursInput) => {
  const totalMinutes = Math.round(hoursInput * 60); // Convert hours to minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${get2DigitString(hours)}:${get2DigitString(minutes)}`;
};

export const convertHoursToDaysAndHours = (hours) => {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return {
    days: days,
    hours: remainingHours
  };
};

// Utility function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const rollWeighted = async (objects) => {
  // Randomize the order of the objects
  const shuffledObjects = shuffleArray([...objects]);

  // Calculate the total weight
  const totalWeight = shuffledObjects.reduce((total, obj) => total + obj.weight, 0);

  // Generate a random number between 0 and totalWeight
  const roll = await new Roll(`1d${totalWeight}`).roll();
  // console.log(roll); // Log the roll for debugging

  // Use the random number to select an object based on weights
  let cumulativeWeight = 0;
  for (const obj of shuffledObjects) {
    cumulativeWeight += obj.weight;
    if (roll.total <= cumulativeWeight) {
      return obj;
    }
  }
};

export const evaluateFormula = async (formula) => {
  const diceRegex = /(\d+[dD]\d+)/g;
  let match;
  const rolls = [];

  // Identify all dice rolls and process them
  while ((match = diceRegex.exec(formula)) !== null) {
    const roll = await new Roll(match[0]).roll();
    rolls.push({ match: match[0], total: roll.total });
  }

  // Replace dice notation with their rolled values
  let evaluatedFormula = formula;
  rolls.forEach(roll => {
    evaluatedFormula = evaluatedFormula.replace(roll.match, roll.total);
  });

  // Evaluate the final expression
  return eval(evaluatedFormula);
};
