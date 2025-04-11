export const getManualResult = async () => {
  return new Promise((resolve) => {
    new Dialog({
      title: "Heal Hit Points",
      content: `
        <form>
          <div class="form-group">
            <label for="hp-healed">Enter number of hit points healed:</label>
            <input type="number" id="hp-healed" name="hp-healed" value="0" min="0" />
          </div>
        </form>
      `,
      buttons: {
        heal: {
          label: "Heal",
          callback: (html) => {
            const hpHealed = Number(html.find("#hp-healed").val());
            resolve(hpHealed); // Return the number entered
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => {
            resolve(null); // Return null if the dialog is canceled
          },
        },
      },
      default: "heal",
    }).render(true);
  });
};
