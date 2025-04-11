// TODO: this is stolen from the clsx npm package, it should be coming through a bundler
export const clsx = (args) => {
	let i=0, tmp, str='', len=args.length;
	for (; i < len; i++) {
		if (tmp = args[i]) {
			if (typeof tmp === 'string') {
				str += (str && ' ') + tmp;
			}
		}
	}
	return str;
};

export const replaceActorIdsWithNames = async (forageCheckResults) => {
  if (!forageCheckResults) {
    return {};
  }

  // Helper function to get actor name by ID
  async function getActorNameById(actorId) {
    const actor = game.actors.get(actorId);
    return actor ? actor.name : actorId;
  }

  // Replace leadForager
  const leadForagerName = await getActorNameById(forageCheckResults.leadForager);

  // Replace assists
  const assistNames = await Promise.all(forageCheckResults.assists.map(getActorNameById));

  // Replace useless
  const uselessNames = await Promise.all(forageCheckResults.useless.map(getActorNameById));

  // Return the new object with names, using the spread operator
  return {
    ...forageCheckResults,
    leadForager: leadForagerName,
    assists: assistNames.join(", "),
    useless: uselessNames.join(", "),
  };
};

export const registerPartial = async (filePath, partialName) => {
  try {
    const response = await fetch(filePath); // Fetch the template file
    const templateContent = await response.text(); // Read response as text
    Handlebars.registerPartial(partialName, templateContent); // Register the partial
    console.log(`Partial registered successfully: ${partialName}`);
  } catch (error) {
    console.error(`Error loading partial ${partialName}:`, error);
  }
};


export const loadStylesheet = (path) => {
  // Check if the stylesheet is already appended
  if (!$(`link[href='${path}']`).length) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = path;
    document.head.appendChild(link);
  }
};

export const csDebounce = (func, delay = 300) => {
  let inDebounce = false;

  return function (...args) {
    if (inDebounce) return; // Skip if already in debounce mode.
    inDebounce = true; // Lock debounce.

    try {
      func.apply(this, args); // Execute the function.
    } finally {
      setTimeout(() => {
        inDebounce = false; // Release debounce after delay.
      }, delay);
    }
  };
};

export const snapToAlternatingHexGrid = (x, y) => {
  const gridWidth = 128; // Horizontal grid size
  const rowSpacing = 111; // Vertical grid spacing

  // Snap Y to the prior multiple of 111
  const snappedY = Math.floor(y / rowSpacing) * rowSpacing;

  // Determine if the row is odd or even
  const isOddRow = (snappedY / rowSpacing) % 2 !== 0;

  // Snap X to the correct sequence based on row type
  const offsetX = isOddRow ? gridWidth / 2 : 0;        // Offset by 64 for odd rows
  const baseX = Math.floor((x - offsetX) / gridWidth) * gridWidth; // Nearest multiple of 128

  const snappedX = baseX + offsetX;

  return { x: snappedX, y: snappedY };
};
