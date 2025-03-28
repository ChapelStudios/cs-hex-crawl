import { bountyTypes } from "../enumsObjects.js";
import { fishingBountyInfo } from "../foraging/fishing.js";
import { gatheringBountyInfo } from "../foraging/gathering.js";
import { herbGatheringBountyInfo } from "../foraging/herbs.js";
import { honeyBountyInfo } from "../foraging/honey.js";
import { huntingBountyInfo } from "../foraging/hunting.js";

export const bountyInformation = {
  [bountyTypes.hunting]: huntingBountyInfo,
  [bountyTypes.fishing]: fishingBountyInfo,
  [bountyTypes.gathering]: gatheringBountyInfo,
  [bountyTypes.honey]: honeyBountyInfo,
  [bountyTypes.herb]: herbGatheringBountyInfo,
};