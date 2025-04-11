export async function displayOptionSelector(options, optionTypeName) {
  return new Promise((resolve) => {
    // Define the form's HTML content
    const optionId = optionTypeName.toLowerCase()
      .replace(/\s+/g, '-');
    const content = `
      <form>
        <div class="form-group">
          <label for="${optionId}-select">Select a ${optionTypeName}</label>
          <select id="${optionId}-select" name="${optionId}">
            ${options.map(option => 
              `<option value="${option.id}">${option.name}</option>`
            )}
          </select>
        </div>
      </form>
    `;

    // Render a dialog
    new Dialog({
      title: `${optionTypeName} Selector`,
      content,
      buttons: {
        submit: {
          label: "Submit",
          callback: (html) => {
            const selectedFaction = html.find(`[name="${optionId}"]`).val();
            resolve(selectedFaction); // Return the selected faction
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => resolve(null) // Return null if canceled
        },
      },
      default: "submit",
    }).render(true);
  });
}
