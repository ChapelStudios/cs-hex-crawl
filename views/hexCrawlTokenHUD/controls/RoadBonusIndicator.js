import { doesTokenHaveRoadBonus } from "../../../repos/moves.js";

export const getRoadBonusIndicator = (token) => ({
  name: "road-bonus-indicator",
  title: "Road Bonus Indicator",
  icon: doesTokenHaveRoadBonus(token)
    ? "fa-solid fa-road"
    : "fa-regular fa-road",
  visible: true,
  section: 'left',
  class: "",
});