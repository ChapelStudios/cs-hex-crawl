export const healTheInfirm = {
  id: "healTheInfirm",
  title: "Heal the Infirm",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: true,
  details: `
    <p><em>Requires Heal 1 rank</em></p>
    <p>Players aid in the infirmary by making a healing check:</p>
    <ul>
      <li><strong>4 or Less:</strong> Get kicked out after being less than helpful; Lose 1d10 medicine and some faction standing with a random faction.</li>
      <li><strong>9 or Less:</strong> You weren't helpful, but at least no one noticed; Lose 1d4 medicine.</li>
      <li><strong>10:</strong> 1 Infirm will recover at the end of the day.</li>
      <li><strong>15:</strong> 1d4 + 1 Infirm will recover at the end of the day.</li>
      <li><strong>20:</strong> 2d6 + 4 Infirm will recover at the end of the day.</li>
      <li><strong>25:</strong> 2d12 + 10 Infirm will recover at the end of the day.</li>
      <li><strong>Above 25:</strong> An additional 1d10 Infirm recover for each additional 5 points above 25.</li>
    </ul>
    <p><em>All players perform this task by themselves with separate checks.</em></p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "hea",
      display: "Heal",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
  ],
  getGmData: (context) => ({}),
};