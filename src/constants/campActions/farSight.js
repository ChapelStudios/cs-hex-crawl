import { csDebounce, snapToAlternatingHexGrid } from "../../helpers/display.js";
import { calculateSpellMaxUses } from "../../helpers/entityTools.js";
import { controlTokenIfNotAlready } from "../../helpers/misc.js";
import { getCampToken } from "../../repos/gameSettings.js";
import { dl3HexCrawlSocket, registerWithSocketReady } from "../../socket.js";
import { hexTokenTypes } from "../moveCosts.js";

export const farSight = {
  title: "Far Sight",
  id: "farSight",
  timeCost: 1,
  repeatable: true,
  useIndependentTracking: false,
  details: `
    <p><em>Requires the ability to cast Divination spells</em></p>
    <p>
      You may expend a 1st-level spell slot to choose to reveal a specific tile on the map, learning of any 
      Events or Foraging Bounties on the revealed tiles. You can instead expend a 2nd-level spell slot to 
      also extend this Divination to all adjacent tiles.
    </p>
    <p><em>This does not reveal random encounters.</em></p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "arcane-1",
      display: "1st Level Arcane Divination Spell",
      rankRequirement: 1, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
    {
      skill: "arcane-2",
      display: "Arcane Divination Spell",
      rankRequirement: 2, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
    {
      skill: "divine-1",
      display: "Divine Divination Spell",
      rankRequirement: 1, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
    {
      skill: "divine-2",
      display: "Divine Divination Spell",
      rankRequirement: 2, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: ({ assignedActor, activity }) => {
    // For spell-based skills (divine/arcane), override maxUses with the sum of available uses.
    const updatedSkills = activity.skills.map((skill) => {
      if (skill.skill.startsWith("arcane") || skill.skill.startsWith("divine")) {
        const magicType = skill.skill.split("-")[0]; // "arcane" or "divine"
        const newMaxUses = calculateSpellMaxUses(assignedActor, magicType, skill.rankRequirement, true);

        return {
          ...skill,
          skill: `${skill.skill}`,
          maxUses: newMaxUses,
        };
      }
      // For item-based skills (or any others), leave them as is.
      return { ...skill };
    }).filter(s => 
      s.maxUses > 0
    );
    return updatedSkills
      ? { skills: updatedSkills }
      : {};
  },
  lockAfterPerform: true,
  onUserPerform: async ({ app, skill }) => {
    const recordNextClick = new Promise(resolve => {
      const handleClick = csDebounce((event) => {
        // Record the click's coordinates
        const location = canvas.mousePosition;
        // Clean up the event listener
        document.removeEventListener('click', handleClick);
    
        // Resolve the promise with the click location
        resolve({
          location,
          isCancel: event.button !== 0
        });
      });
      // Add the click event listener
      document.addEventListener('click', handleClick);
    });
    const { width, height, top, left } = app.options;

    await app.minimize();

    const { location: mouseLocation, isCancel } = await recordNextClick;
    if (isCancel) {
      await app.maximize();
      app.setPosition({ width, height, top, left });
      return { isCancel: true };
    }

    const snappedLocation = snapToAlternatingHexGrid(mouseLocation.x, mouseLocation.y);

    const tokenDropResult = await dl3HexCrawlSocket.executeAsGM(dropFarSightTokenActionName, snappedLocation, skill);
    if (!tokenDropResult.wasSuccess) {
      await app.maximize();
      app.setPosition({ width, height, top, left });
      console.error(tokenDropResult.errorMsg, tokenDropResult.error);
      return { isCancel: true };
    }
    
    // Record the second click
    const waitForSecondClick = new Promise(resolve => {
        const handleSecondClick = () => {
            document.removeEventListener('click', handleSecondClick);
            resolve();
        };
        document.addEventListener('click', handleSecondClick);
    });

    await waitForSecondClick;
    await app.maximize();
    app.setPosition({ width, height, top, left });
    return {};
  },
  isNoCheck: true,
  resolveBonuses: async ({ baseBonus, actionData }) => Promise.resolve([{
    ...baseBonus,
    wasApplied: true,
    value: `FarSight was performed by ${actionData.performer} at Level ${actionData.skillDetails.rankRequirement}.`,
  }]),
}

const dropFarSightTokenActionName = "dropFarSightToken";
const dropFarSightToken = async (snappedLocation, skill) => {
  const actor = game.actors.find(actor => actor.flags.hexCrawl?.actorType === hexTokenTypes.farSight);

  if (!actor) {
    return {
      wasSuccess: false,
      errorMsg: "Far sight actor missing",
    };
  }

  try {
    // Step 3: Use the actor's prototypeToken settings to create a token
    const tokenData = actor.prototypeToken.toObject(); // Clone prototypeToken
    tokenData.actorId = actor.id;
    tokenData.x = snappedLocation.x;
    tokenData.y = snappedLocation.y;
    tokenData.ownership = actor.ownership;
    tokenData.brightSight = 0.25; //legacy
    tokenData.sight.range = 0.25;
    if (skill.rankRequirement === 2) {
      tokenData.sight.range = 1.5;
      tokenData.brightSight = 1.5; // legacy
    }

    // Create the token on the current scene
    // CONFIG.Token.documentClass = TokenDocument;
    const newToken = await canvas.scene.createEmbeddedDocuments('Token', [tokenData]);
    console.log(`Token created for ${actor.name} at location (${snappedLocation.x}, ${snappedLocation.y}).`);
    if (newToken?.length > 0) {
      const tokenId = newToken[0].id; // Get the ID of the placed token
      const farSightToken = canvas.tokens.get(tokenId); // Retrieve the token on the canvas
      farSightToken.control(); // Select the token (adds control to it)
    }
    const campToken = getCampToken(canvas.scene);
    controlTokenIfNotAlready(campToken.id);

  } catch (error) {
    return {
      wasSuccess: false,
      errorMsg: "Error while creating the Far sight token:",
    };
    // console.error("Error while creating the Far sight token:", error);
  }

  return {
    wasSuccess: true,
  };
}

registerWithSocketReady(
  dropFarSightTokenActionName,
  dropFarSightToken,
);