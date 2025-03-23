import { isFarSightToken, isHexCrawlToken } from "../repos/gameSettings.js";

// Global cache for fog canvas data.
let fogCanvas = null;

/**
 * Extracts a snapshot of the current fog-of-war layer using PIXI’s extract plugin.
 * @returns {HTMLCanvasElement|null} A canvas element representing the current fog or null on failure.
 */
export const getFogCanvas = async () => {
  try {
    // canvas.fog is the FogLayer container in Foundry
    game.hexCrawl.fogCanvas = canvas.app.renderer.plugins.extract.canvas(canvas.fog);
  } catch (error) {
    console.error("Failed to extract fog canvas:", error);
    game.hexCrawl.fogCanvas = null;
  }
}

export const cachePixelData = async () => {
  let renderTexture = null;
  try {
    const fogSprite = canvas.fog.sprite;
    const fogTexture = fogSprite.texture;
    // Create a PIXI.RenderTexture to extract pixel data
    renderTexture = PIXI.RenderTexture.create({
      width: fogTexture.width,
      height: fogTexture.height,
      resolution: 1,
    });
    canvas.app.renderer.render(fogSprite, renderTexture);
  
    // Extract pixel data from the texture
    const pixelData = canvas.app.renderer.extract.pixels(renderTexture);
    game.hexCrawl.fogPixelData = pixelData;
    unrevealedLocationsCache.clear();
  } catch (error) {
    console.error("Failed to extract fog canvas:", error);
    game.hexCrawl.fogPixelData = null;
  } finally {
    if (renderTexture) {
      // Cleanup renderTexture
      renderTexture.destroy(true);
    }
  }
}

export const clearUnrevealedLocationsCache = () => {
  unrevealedLocationsCache.clear();
}

/**
 * Determines whether a given mouse position corresponds to an explored area of the map.
 * @param {{x: number, y: number}} mousePos - The mouse position in scene coordinates.
 * @param {HTMLCanvasElement} fogCanvas - The offscreen canvas created from fogExplored.
 * @returns {boolean} True if the area is considered explored (i.e., fog cleared).
 */
const revealedLocationsCache = new Set();
const unrevealedLocationsCache = new Set();
const generateCacheKey = (x, y) => `${Math.floor(x)},${Math.floor(y)}`;
export const isAreaExplored = (mousePos) => {
  // if (!game.hexCrawl.fogPixelData) {
  //   console.error("missing fog pixel data");
  // }

  const cacheKey = generateCacheKey(mousePos.x, mousePos.y);
  if (revealedLocationsCache.has(cacheKey)) {
    return true;
  }
  if (unrevealedLocationsCache.has(cacheKey)) {
    return false;
  }
  
  const fogSprite = canvas.fog.sprite;
  const fogTexture = fogSprite.texture;
  const inverseTransform = fogSprite.worldTransform.clone().invert();
  const textureCoords = inverseTransform.apply({ x: mousePos.x, y: mousePos.y });

  if (
    textureCoords.x < 0
    || textureCoords.x >= fogTexture.width
    || textureCoords.y < 0
    || textureCoords.y >= fogTexture.height
  ) {
    return false; 
  }

  // Compute the pixel index in the 1D pixel array
  const texX = Math.floor(textureCoords.x);
  const texY = Math.floor(textureCoords.y);
  const pixelIndex = (texY * fogTexture.width + texX) * 4; // 4 values per pixel: R, G, B, A

  // Check the alpha value (A) to determine visibility
  const fogPixels = fogTexture.baseTexture.resource.source;
  const isRevealed = game.hexCrawl.fogPixels[pixelIndex + 3] > 0;
  
  if (isRevealed) {
    revealedLocationsCache.add(cacheKey); // Add to revealed cache
  } else {
    unrevealedLocationsCache.add(cacheKey); // Add to unrevealed cache
  }

  return isRevealed;
}

const updaterevealedLocationsCache = (cacheKey, isRevealed) => {
  if (isRevealed) {
    revealedLocationsCache.add(cacheKey); // Add to revealed cache
  } else {
    unrevealedLocationsCache.add(cacheKey); // Add to unrevealed cache
  }
}

/**
 * Loop through all tokens on the scene and check their visibility based on custom conditions.
 * @param {Object} point - The point to check visibility for.
 * @param {Object} options - Options including tolerance.
 * @returns {Array} - A list of tokens that meet the custom conditions and pass the visibility check.
 */
export const checkVisibilityForTokens = (point, options = {}) => {
  const cacheKey = generateCacheKey(point.x, point.y);
  if (revealedLocationsCache.has(cacheKey)) {
    return true;
  }
  if (unrevealedLocationsCache.has(cacheKey)) {
    return false;
  }

  // Loop through all tokens on the scene
  for (const token of canvas.tokens.placeables) {
    const tokenDoc = token.document;
      // Apply your custom checks
      if (isHexCrawlToken(tokenDoc) || isFarSightToken(tokenDoc)) {
        // Check if the token can see the point
        const tolerance = Math.min(tokenDoc.w, tokenDoc.h) / 4;
        const isVisible = checkVisibility(point, { tolerance, object: tokenDoc, ...options });

        if (isVisible) {
          console.log(`Token ${token.name} passes visibility check.`);
          updaterevealedLocationsCache(cacheKey, true);
          return true;
        } else {
          console.log(`Token ${token.name} does not pass visibility check.`);
        }
      }
  }

  updaterevealedLocationsCache(cacheKey, false);
  return false;
};


export const checkVisibility = (point, { tolerance = 2, object = null } = {}) => {
  // skip if GM
  if (game.user.isGM) {
    return true;
  }


  // Get scene rect to ensure points are within bounds
  const sceneRect = canvas.dimensions.sceneRect;
  const inBuffer = !sceneRect.contains(point.x, point.y);

  // Generate test points based on tolerance offsets
  const offsets = tolerance > 0
      ? [[0, 0], [-tolerance, -tolerance], [-tolerance, tolerance], [tolerance, tolerance], [tolerance, -tolerance], 
        [-tolerance, 0], [tolerance, 0], [0, -tolerance], [0, tolerance]]
      : [[0, 0]];

  const config = {
      object,
      tests: offsets.map(offset => ({
          point: new PIXI.Point(point.x + offset[0], point.y + offset[1]),
          los: new Map()
      }))
  };

  const detectionModes = CONFIG.Canvas.detectionModes;

  // Check light sources providing vision
  for (const lightSource of canvas.effects.lightSources.values()) {
      if (!lightSource.data.vision || !lightSource.active || lightSource.disabled) continue;
      if (lightSource.testVisibility(config)) {
        return true;
      }
  }

  // Check basic vision sources
  for (const visionSource of canvas.effects.visionSources.values()) {
      if (!visionSource.active) continue;

      // Ensure the source is within the buffer
      if (inBuffer === sceneRect.contains(visionSource.x, visionSource.y)) continue;

      const token = visionSource.object.document;
      const basicDetection = token.detectionModes.find(mode => mode.id === DetectionMode.BASIC_MODE_ID);
      if (!basicDetection) continue;

      if (detectionModes.basicSight.testVisibility(visionSource, basicDetection, config)) {
        return true;
      }
  }

  // Check advanced detection modes (specific to tokens)
  if (!(object instanceof Token)) {
    return false; // Advanced modes only apply to tokens
  }
  for (const visionSource of canvas.effects.visionSources.values()) {
      if (!visionSource.active) continue;

      // Ensure the source is within the buffer
      if (inBuffer === sceneRect.contains(visionSource.x, visionSource.y)) continue;

      const token = visionSource.object.document;
      for (const mode of token.detectionModes) {
          if (mode.id === DetectionMode.BASIC_MODE_ID) continue; // Skip basic detection
          const detectionMode = detectionModes[mode.id];
          if (detectionMode?.testVisibility(visionSource, mode, config)) {
              object.detectionFilter = detectionMode.constructor.getDetectionFilter();
              return true;
          }
      }
  }

  return false;
};
