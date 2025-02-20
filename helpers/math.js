
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

export const isWithinRange = (min, max, result) => {
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

