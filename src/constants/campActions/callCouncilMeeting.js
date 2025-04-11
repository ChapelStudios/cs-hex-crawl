import { displayOptionSelector } from "../../helpers/optionSelector.js";

export const callCouncilMeeting = {
  id: "callCouncilMeeting",
  title: "Call a Council Meeting",
  timeCost: 2, // Time varies based on the number of topics discussed
  repeatable: false,
  useIndependentTracking: false,
  lockAfterPerform: false,
  details: `
    <p>
      Call a council meeting to discuss the current state of the camp and its inhabitants. You may choose to discuss up to 3 topics to be voted on.
    </p>
    <p><em>The time cost is increased by the number of topics selected. It costs 2 hours for the first topic and 1 hour for each additional topic.</em></p>
  `,
  skills: [
    {
      skill: "dip",
      display: "Diplomacy",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
    {
      skill: "intimidate",
      display: "Intimidate",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
    {
      skill: "blf",
      display: "Bluff",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
  ],
  aidSkills: [
    {
      skill: "blf",
      display: "Bluff",
      dc: 10
    },
    {
      skill: "intimidate",
      display: "Intimidate",
      dc: 10
    },
    {
      skill: "sen",
      display: "Sense Motive",
      dc: 10
    },
    {
      skill: "dip",
      display: "Diplomacy",
      dc: 10
    },
    {
      skill: "spt",
      display: "Spot",
      dc: 15
    },
    {
      skill: "lis",
      display: "Listen",
      dc: 15
    },
    {
      skill: "khi",
      dc: 15
    },
    {
      skill: "kge",
      dc: 10
    },
    {
      skill: "klo",
      dc: 10
    },
    {
      skill: "kna",
      dc: 15
    },
  ],
  onUserPerform: async ({ remainingHours }) => {
    const maxTopics = 3;
    const maxTopicsByTime = remainingHours - 1; // 1 hour for the first topic, 1 hour for each additional topic
    const maxSelectableTopics = Math.min(maxTopicsByTime, maxTopics);
    const options = [];
    for (let i = 1; i <= maxSelectableTopics; i++) {
      options.push({
        name: i,
        id: i,
      });
    }
    const hours = await displayOptionSelector(options, "Number of Topics");

    return {
      costOverride: hours,
      isCancel: !hours,
    };
  },
  getCheckmarkData: ({ costOverride }) => {
    return costOverride
      ? ` with ${costOverride} topic${costOverride > 1 ? 's' : ''}`
      : '';
  },
};
