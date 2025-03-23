export async function displayFactionSelector(factionOptions) {
  return new Promise((resolve) => {
    // Define the form's HTML content
    const content = `
      <form>
        <div class="form-group">
          <label for="faction-select">Select a Faction</label>
          <select id="faction-select" name="faction">
            ${factionOptions.map(faction => 
              `<option value="${faction.id}">${faction.name}</option>`
            )}
          </select>
        </div>
      </form>
    `;

    // Render a dialog
    new Dialog({
      title: "Faction Selector",
      content,
      buttons: {
        submit: {
          label: "Submit",
          callback: (html) => {
            const selectedFaction = html.find('[name="faction"]').val();
            resolve(selectedFaction); // Return the selected faction
          }
        },
        cancel: {
          label: "Cancel",
          callback: () => resolve(null) // Return null if canceled
        }
      },
      default: "submit"
    }).render(true);
  });
}
