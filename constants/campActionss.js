const campActionsData = [


  {
    title: "Cook",
    timeCost: 2,
    repeatable: false,
    details: `
      <p><em>Requires Profession (Cooking) 1 rank</em></p>
      <p>
        Upon a successful check, DC 15, spices consumed during Upkeep that night provide 2 bonuses instead of 1. 
        If there are no spices, this grants a chance for a bonus equal to the total of the roll.
      </p>
    `,
    aidSkills: [
      {
        skill: "sur",
        display: "Survival",
        dc: 10
      },
      {
        skill: "crf.subSkills.crf1",
        display: "Craft (Cooking)",
        dc: 10
      },
      {
        skill: "pro",
        display: "Profession (Cook)",
        dc: 10
      },
      {
        skill: "dex",
        display: "Dexterity",
        dc: 15
      }
    ],
    skill: "crf.subSkills.crf1",
  },
  {
    title: "Gather Firewood",
    timeCost: 1,
    repeatable: true,
    details: `
      <p>
        You assist with gathering firewood for the night. Upon a successful DC 10 Strength or 8 Survival check, 
        you're able to grab enough wood to bolster one faction's supply for the day, improving your standing with that faction. 
        You can also choose to give it to the cooking fires to give a +5 bonus to a Cook activity.
      </p>
      <p><em>All players perform this task by themselves with separate checks.</em></p>
    `,
    aidSkills: []
  },
  {
    title: "Check into a Faction",
    timeCost: 1,
    repeatable: true,
    details: `
      <p>
        Players can make a Gather Information check to talk to a faction's populace. This can have varying outcomes based on the result of the check:
      </p>
      <ul>
        <li><strong>5 or Less:</strong> The populace thinks you're too nosey and the heroes lose standing with that faction.</li>
        <li><strong>10:</strong> Learn about the general attitude of that faction without affecting your reputation.</li>
        <li><strong>15:</strong> Learn any available Key information.</li>
        <li><strong>20:</strong> Gain a +2 bonus next time you interact with that faction's leader.</li>
        <li><strong>25:</strong> Gain bonus standing with that faction.</li>
      </ul>
    `,
    aidSkills: [
      {
        skill: "blf",
        display: "Bluff",
        dc: 10
      },
      {
        skill: "int",
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
        skill: "lis",
        display: "Listen",
        dc: 15
      },
      {
        skill: "spt",
        display: "Spot",
        dc: 15
      }
    ],
    skill: "dip",
  },
  {
    title: "Influence a Faction Leader",
    timeCost: 1,
    repeatable: true,
    details: `
      <p>
        Check what the various faction leaders are concerned with and attempt to influence them with a Diplomacy check.
      </p>
      <p><em>Beware, some factions and their leaders respond differently to different secondary skill tactics.</em></p>
    `,
    aidSkills: [
      {
        skill: "blf",
        display: "Bluff",
        dc: 10
      },
      {
        skill: "int",
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
      }
    ],
    skill: "dip",
  },
  {
    title: "Set Perimeter",
    timeCost: 2,
    repeatable: false,
    details: `
      <p><em>Requires Craft (Trap-Making) 5 ranks or the ability to cast Abjuration spells</em></p>
      <p>
        By either expending a first-level spell slot or succeeding on a DC 15 Craft (Trap-Making) check, 
        you set an alarm around the camp's perimeter. This advance warning gives a +2 to morale checks and 
        a +2 to combat checks if the party is attacked.
      </p>
    `,
    aidSkills: [
      {
        skill: "dev",
        display: "Disable Device",
        dc: 10
      },
      {
        skill: "sur",
        display: "Survival",
        dc: 10
      },
      {
        skill: "dex",
        display: "Dexterity",
        dc: 15
      },
      {
        skill: "int",
        display: "Intelligence",
        dc: 15
      }
    ],
    skill: "dev",
  },
  {
    title: "Far Sight",
    timeCost: 1,
    repeatable: true,
    details: `
      <p><em>Requires the ability to cast Divination spells</em></p>
      <p>
        You may expend a 1st-level spell slot to choose to reveal a specific tile on the map, learning of any 
        Events or Foraging Bounties on the revealed tiles. You can instead expend a 2nd-level spell slot to 
        also extend this Divination to all adjacent tiles.
      </p>
      <p><em>This does not reveal random encounters.</em></p>
    `,
    aidSkills: [],
    skill: "sur",
  },
  {
    title: "Illusory Intervention",
    timeCost: 2,
    repeatable: false,
    details: `
      <p><em>Requires the ability to cast Illusion spells</em></p>
      <p>
        You can expend a 1st-level spell slot to cast illusions around the camp, 
        lowering the chances of an attack during the night and negating some of the effects of the campfire.
      </p>
    `,
    aidSkills: [],
    skill: "dex",
  },
];


export const testCampActions = [
  {
    id: "improveMedicine",
    title: "Improve Medicine",
    timesPerformed: 2,
    performers: [
      { name: "Jim Bub", actorId: "tISOlEbz1Q3WwcLr" }
    ],
    aides: [
      {
        name: "Joe",
        actorId: "2ZC58yvWteuGnFym",
        skill: "crf.subSkills.crf4",
        dc: 10,
        skillDisplay: "Craft (Alchemy)"
      }
    ]
  },
  // {
  //   title: "Create Weapons",
  //   timesPerformed: 1,
  //   performers: [{ name: "Kermian", actorId: "GPD7cCstezDA5Ta3" }],
  //   aides: [
  //     {
  //       name: "Owien Thornblade",
  //       actorId: "XvFtkNSt0ShKZGZI",
  //       skill: "str",
  //       dc: 10,
  //       skillDisplay: "Strength"
  //     }
  //   ]
  // },
  // {
  //   title: "Organize the Foragers",
  //   timesPerformed: 3,
  //   performers: [
  //     { name: "Snowstar", actorId: "3SYTo70r71d5Iqee" },
  //     { name: "Uncle Borrowhammer", actorId: "sfJTp68tRbiYhNRK" },
  //     { name: "Vermilion Duskwood", actorId: "plLkac4KQYVYTfSZ" }
  //   ],
  //   aides: [
  //     {
  //       name: "Zaytak",
  //       actorId: "pePBl4wlMWZStcvo",
  //       skill: "sur",
  //       dc: 10,
  //       skillDisplay: "Survival"
  //     }
  //   ]
  // },
  // {
  //   title: "Heal the Infirm",
  //   timesPerformed: 2,
  //   performers: [{ name: "Airy", actorId: "BDxk3fVobCHCSFIu" }],
  //   aides: [] // No aidSkills defined for this action
  // },
  // {
  //   title: "Perform Miracles",
  //   timesPerformed: 5,
  //   performers: [
  //     { name: "Jim Bub", actorId: "tISOlEbz1Q3WwcLr" },
  //     { name: "Joe", actorId: "2ZC58yvWteuGnFym" }
  //   ],
  //   aides: [] // No aidSkills defined for this action
  // },
  // {
  //   title: "Cook",
  //   timesPerformed: 1,
  //   performers: [{ name: "Kermian", actorId: "GPD7cCstezDA5Ta3" }],
  //   aides: [
  //     {
  //       name: "Owien Thornblade",
  //       actorId: "XvFtkNSt0ShKZGZI",
  //       skill: "dex",
  //       dc: 15,
  //       skillDisplay: "Dexterity"
  //     }
  //   ]
  // },
  // {
  //   title: "Gather Firewood",
  //   timesPerformed: 2,
  //   performers: [
  //     { name: "Snowstar", actorId: "3SYTo70r71d5Iqee" },
  //     { name: "Uncle Borrowhammer", actorId: "sfJTp68tRbiYhNRK" }
  //   ],
  //   aides: [] // No aidSkills defined for this action
  // },
  // {
  //   title: "Check into a Faction",
  //   timesPerformed: 3,
  //   performers: [{ name: "Vermilion Duskwood", actorId: "plLkac4KQYVYTfSZ" }],
  //   aides: [
  //     {
  //       name: "Zaytak",
  //       actorId: "pePBl4wlMWZStcvo",
  //       skill: "dip",
  //       dc: 10,
  //       skillDisplay: "Diplomacy"
  //     }
  //   ]
  // },
  // {
  //   title: "Influence a Faction Leader",
  //   timesPerformed: 2,
  //   performers: [{ name: "Airy", actorId: "BDxk3fVobCHCSFIu" }],
  //   aides: [
  //     {
  //       name: "Jim Bub",
  //       actorId: "tISOlEbz1Q3WwcLr",
  //       skill: "blf",
  //       dc: 10,
  //       skillDisplay: "Bluff"
  //     }
  //   ]
  // },
  // {
  //   title: "Set Perimeter",
  //   timesPerformed: 1,
  //   performers: [{ name: "Jim Bub", actorId: "tISOlEbz1Q3WwcLr" }],
  //   aides: [
  //     {
  //       name: "Joe",
  //       actorId: "2ZC58yvWteuGnFym",
  //       skill: "dex",
  //       dc: 15,
  //       skillDisplay: "Dexterity"
  //     }
  //   ]
  // },
  // {
  //   title: "Far Sight",
  //   timesPerformed: 2,
  //   performers: [
  //     { name: "Kermian", actorId: "GPD7cCstezDA5Ta3" },
  //     { name: "Owien Thornblade", actorId: "XvFtkNSt0ShKZGZI" }
  //   ],
  //   aides: [] // No aidSkills defined for this action
  // },
  // {
  //   title: "Illusory Intervention",
  //   timesPerformed: 1,
  //   performers: [{ name: "Snowstar", actorId: "3SYTo70r71d5Iqee" }],
  //   aides: [] // No aidSkills defined for this action
  // }
];
