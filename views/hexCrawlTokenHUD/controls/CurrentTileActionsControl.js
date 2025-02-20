import { getTileByLocation } from "../../../repos/tiles.js";
import { renderHexDetailInfo } from "../../hexInfo/HexInfo.js";

export const getCurrentTileActionsControl = (token, isOwner) => ({
  name: "open-hex-crawl-actions",
  title: "Open Actions for Current Hex",
  icon: "fa-solid fa-hexagon-image", // Font Awesome icon
  onclick: async (event) => {
    renderHexDetailInfo(await getTileByLocation(canvas.scene, token), token);
  },
  visible: isOwner,
  section: 'right',
});