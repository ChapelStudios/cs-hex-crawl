import { callCouncilMeeting } from "./callCouncilMeeting.js";
import { checkOnFaction } from "./checkOnFaction.js";
import { createWeapons } from "./createWeapons.js";
import { farSight } from "./farSight.js";
import { gatherFirewood } from "./gatherFirewood.js";
import { healTheInfirm } from "./healTheInfirm.js";
import { illusoryIntervention } from "./illusoryIntervention.js";
import { improveMedicine } from "./improveMedicine.js";
import { influenceAFaction } from "./influenceAFaction.js";
import { organizeForagers } from "./organizeForagers.js";
import { performMiracles } from "./performMiracles.js";
import { prepareBanquet } from "./prepareBanquet.js";
import { setPerimeter } from "./setPerimeter.js";

export const campActionsData = [
  callCouncilMeeting,
  checkOnFaction,
  createWeapons,
  farSight,
  gatherFirewood,
  healTheInfirm,
  illusoryIntervention,
  improveMedicine,
  influenceAFaction,
  organizeForagers,
  performMiracles,
  prepareBanquet,
  setPerimeter,
];

export const getActivityById = (activityId) => {
  return campActionsData.find(ca => ca.id === activityId);
}
