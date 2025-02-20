import { openInventoryForm } from "../../inventory/inventoryManager.js";

export const getOpenInventoryControl = (token) => ({
  name: "open-hex-crawl-inventory",
  title: "Open Party Inventory",
  icon: "fa-solid fa-hexagon-exclamation", // Font Awesome icon
  onclick: (event) => {
    openInventoryForm(token);
  },
  class: 'flipped',
  visible: token.owner,
  section: 'right',
});