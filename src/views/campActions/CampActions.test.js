import $ from 'jquery';
import Handlebars from 'handlebars';
import { CampActions } from './CampActions.js';
import { CampActionsState } from './campActionsState.js';
import * as UI from './campActionsUI.js';
import mockCanvas from '../../../tests/mocks/canvas.js';
import { getCampToken, refreshCampActionsHandlerName, saveActionsRequestActionName, updateCurrentCampActions } from '../../repos/gameSettings.js';
import { dl3HexCrawlSocket } from '../../socket.js';
import { getProvisions } from "../../repos/provisions.js";


const mockContext = { maxHours: 6, // Total downtime hours available
  activities: [
    {
      id: 1,
      title: "Foraging",
      timeCost: 2,
      repeatable: true,
      details: "<p>Spend time gathering food and supplies.</p>",
      errorMessage: null,
      hasValidPerformSkills: true,
      performSkillChoices: [
        {
          value: "survival",
          label: "Survival (+3)",
          disabled: false
        },
        {
          value: "nature",
          label: "Nature (+2)",
          disabled: false
        },
      ],
      aidSkills: true,
      hasValidAidSkills: true,
      aidSkillChoices: [
        {
          value: "survival",
          label: "Survival (+3)",
          disabled: false
        },
        {
          value: "perception",
          label: "Perception (+1)",
          disabled: false
        },
      ],
    },
    {
      id: 2,
      title: "Repair Equipment",
      timeCost: 3,
      repeatable: false,
      details: "<p>Fix damaged gear or tools.</p>",
      errorMessage: "You lack the necessary skills to repair equipment.",
      hasValidPerformSkills: false,
      performSkillChoices: [],
      aidSkills: false,
      hasValidAidSkills: false,
      aidSkillChoices: [],
    },
  ],
};
jest.mock('../../helpers/display.js', () => ({ loadStylesheet: jest.fn(), registerPartial: jest.fn(), }));
const mockGetSelectOptionFromSkillResult = { "disabled": false, "label": undefined, "rank": 2, "skill": undefined }; 

jest.mock(
  '../../helpers/entityTools.js',
  () => ({
    getSelectOptionForPerform: jest.fn((skill) => ({
      skill: skill.skill,
      rank: skill.skill === 'Skill1' ? 3 : 2,
      label: skill.skill,
      disabled: false, // Or a condition if required
    })),
    getSelectOptionFromSkill: jest.fn((skill) => ({ ...mockGetSelectOptionFromSkillResult })),
    disambiguateSkillCode: jest.fn((skill) => skill),
  }));

jest.mock('../../socket.js', () => ({ 
  dl3HexCrawlSocket: { executeAsGM: jest.fn(), executeForOthers: jest.fn(), },
}));

jest.mock("../../repos/provisions.js", () => ({
  getProvisions: jest.fn(() => "mockToken"), // Mock return value here
}));

jest.mock("../../repos/gameSettings.js", () => ({
  updateCurrentCampActions: jest.fn().mockResolvedValue(),
  refreshCampActionsHandlerName: "refreshCampActionsHandlerName",
  campActionsAppId: "campActionsAppId",
  getCampToken: jest.fn(() => { id: "mockToken" }), // Mock return value here
  getCurrentCampActions: jest.fn(() => ({})),
  getPartyMemberList: jest.fn(() => []),
  getUserActionsForDay: jest.fn(() => []),
  saveActionsRequestActionName: "saveActionsRequestActionName",
}));

// Setup global canvas for tests
global.canvas = mockCanvas;

/* ============================
Tests for Global State Manager
============================ */
describe('CampActionsState', () => {
  let state;
  beforeEach(() => {
    state = new CampActionsState({}, {});
  });

  describe('updateActivity', () => {
    it('should initialize and increment performer for non-aid action', () => {
      const record = state.updateActivity('activity1', 'Hero', false);
      expect(record.performers.Hero).toBe(1);
      // Call again to simulate multiple actions
      state.updateActivity('activity1', 'Hero', false);
      expect(state.getState()['activity1'].performers.Hero).toBe(2);
    });

    it('should add a helper without duplication for aid action', () => {
      const record = state.updateActivity('activity1', 'Hero', true);
      expect(record.helpers).toContain('Hero');
      // Calling again should not create duplicate
      state.updateActivity('activity1', 'Hero', true);
      const heroCount = record.helpers.filter(name => name === 'Hero').length;
      expect(heroCount).toBe(1);
    });
  });

  describe('unselectActivity', () => {
    beforeEach(() => {
      state.state = {
        activity1: {
          performers: { Hero: 2, Ally: 1 },
          helpers: ['Hero', 'Ally']
        }
      };
    });
    it('should decrement performer count', () => {
      state.unselectActivity('activity1', 'Hero', false);
      expect(state.getState().activity1.performers.Hero).toBe(1);
    });
    it('should remove performer when count reaches zero', () => {
      state.state.activity1.performers.Hero = 1;
      state.unselectActivity('activity1', 'Hero', false);
      expect(state.getState().activity1.performers.Hero).toBeUndefined();
    });
    it('should remove helper entry', () => {
      state.unselectActivity('activity1', 'Hero', true);
      expect(state.getState().activity1.helpers).not.toContain('Hero');
    });
    it('should remove entire activity record if no data remains', () => {
      state.state.activity1 = {
        performers: { Hero: 1 },
        helpers: []
      };
      state.unselectActivity('activity1', 'Hero', false);
      expect(state.getState().activity1).toBeUndefined();
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      state.state = {
        activity1: {
          performers: { Hero: 2, Ally: 1 },
          helpers: ['Hero', 'Ally']
        },
        activity2: {
          performers: { Hero: 1 },
          helpers: []
        }
      };
    });
    it('should set performer count to 0 and remove helpers for the given actor', () => {
      state.cleanup('Hero');
      expect(state.state.activity1.performers.Hero).toBe(0);
      expect(state.state.activity1.helpers).not.toContain('Hero');
      expect(state.state.activity2.performers.Hero).toBe(0);
    });
  });
});


/* ============================
Tests for UI Helper Functions
============================ */
describe('campActionsUI module', () => {

describe('updateSkillOptions', () => {
  let container;
  beforeEach(() => {
    // Create a container and append to document so jQuery selectors behave as expected.
    container = $('<div></div>').appendTo(document.body);
  });
  afterEach(() => {
    container.remove();
  });
  
  it('should update data attributes based on skill choices', () => {
    const activity = {
      skills: [{ skill: 'Skill1' }],
      aidSkills: [{ skill: 'Skill2' }]
    };
    // Fake generator returns an array with non-disabled options.
    const fakeGenerateSkillChoices = (skills) => skills.map(skill => ({ disabled: false }));
    UI.updateSkillOptionsDisabled(container, activity, fakeGenerateSkillChoices);
    expect(container.data('perform-disabled')).toBe(false);
    expect(container.data('aid-disabled')).toBe(false);
  });
});

describe('updateGlobalHelpers', () => {
  let container;
  beforeEach(() => {
    container = $(`
      <div>
        <div class="cs-dl3-activity-options">
          <div class="cs-dl3-aid-helpers-row"></div>
        </div>
      </div>
    `).appendTo(document.body);
  });
  afterEach(() => {
    container.remove();
  });
  
  it('should update with a performed message if performers exist', () => {
    const globalState = { performers: { Hero: 2, Ally: 1 } };
    UI.updateGlobalInfo(container, globalState);
    const content = container.find(".cs-dl3-aid-helpers-row").html();
    expect(content).toContain("Performed by:");
    expect(content).toContain("Hero x2");
    expect(content).toContain("Ally");
  });

  it('should update with an aided message if helpers exist', () => {
    const globalState = { helpers: ['Hero', 'Ally'] };
    UI.updateGlobalInfo(container, globalState);
    const content = container.find(".cs-dl3-aid-helpers-row").html();
    expect(content).toContain("Aided by:");
    expect(content).toContain("Hero");
    expect(content).toContain("Ally");
  });

  it('should clear and hide the aid helpers row if no message exists', () => {
    // Pre-populate with some content.
    container.find(".cs-dl3-aid-helpers-row").html("Some Content");
    UI.updateGlobalInfo(container, {});
    const aidRow = container.find(".cs-dl3-aid-helpers-row");
    expect(aidRow.html()).toBe("");
    expect(aidRow.hasClass("cs-dl3-hidden")).toBe(true);
  });
});

describe('computeButtonState & updateButtons', () => {
  let container;
  beforeEach(() => {
    container = $(`
      <div>
        <button class="cs-dl3-activity-action">Old Text</button>
        <div class="cs-dl3-aid-helpers-row">Pre-existing Info</div>
      </div>
    `).appendTo(document.body);
  });
  afterEach(() => {
    container.remove();
  });
  
  it('should compute correct state for independent tracking & repeatable', () => {
    const activity = { useIndependentTracking: true, repeatable: true };
    const globalState = { helpers: ['Hero', 'Ally'] };
    const result = UI.computeButtonState(activity, globalState, "Perform Action", "Performed by: Test");
    expect(result.buttonText).toBe("Perform Action");
    expect(result.infoHtml).toContain("Aided by:");
    expect(result.showInfoDiv).toBe(true);
  });

  it('should compute correct state for independent tracking & non-repeatable', () => {
    const activity = { useIndependentTracking: true, repeatable: false };
    const globalState = { performers: { Hero: 1 } };
    const result = UI.computeButtonState(activity, globalState, "Perform Action", "Performed by: Test");
    expect(result.buttonText).toBe("Perform Action");
    expect(result.infoHtml).toBe("Performed by: Test");
    expect(result.showInfoDiv).toBe(true);
  });

  it('should compute correct state for non-independent tracking & repeatable', () => {
    const activity = { useIndependentTracking: false, repeatable: true };
    const globalState = { helpers: ['Hero'], performers: { Bob: 2 } };
    const result = UI.computeButtonState(activity, globalState, "Perform Action", "Performed by: Test");
    expect(result.buttonText).toBe("Perform Action");
    expect(result.infoHtml).toContain("Aided by:");
    expect(result.infoHtml).toContain("Performed by:");
    expect(result.showInfoDiv).toBe(false);
  });

  it('should compute correct state for non-independent tracking & non-repeatable', () => {
    const activity = { useIndependentTracking: false, repeatable: false };
    const globalState = { performers: { Hero: 1 } };
    const result = UI.computeButtonState(activity, globalState, "Perform Action", "Performed by: Test");
    expect(result.buttonText).toBe("Performed by: Hero");
    expect(result.infoHtml).toBe("");
    expect(result.showInfoDiv).toBe(false);
  });

  it('should update only the perform button text in the DOM accordingly', () => {
    const activity = { useIndependentTracking: true, repeatable: true, id: "testActivity" };
    const globalState = { helpers: ['Hero', 'Ally'] };
    // updateButtons only sets the perform button text.
    UI.updatePerformButton(container, activity, globalState, "Perform Action", "Performed by: Test");
    expect(container.find(".cs-dl3-activity-action").text()).toBe("Perform Action");
    // The info div should remain unchanged ("Pre-existing Info")
    expect(container.find(".cs-dl3-aid-helpers-row").html()).toBe("Pre-existing Info");
  });
});

describe('toggleAidSection', () => {
  let container;
  beforeEach(() => {
    container = $(`
      <div>
        <div class="cs-dl3-aid-another-container"></div>
        <div class="cs-dl3-aid-helpers-row"></div>
      </div>
    `).appendTo(document.body);
  });
  afterEach(() => {
    container.remove();
  });
  
  it('should hide the aid container when activity has no aid skills', async () => {
    const activity = { aidSkills: [] };
    await UI.toggleAidSection(container, activity, { performers: {}, helpers: [] }, {});
    const containerDiv = container.find(".cs-dl3-aid-another-container");
    expect(containerDiv.hasClass("cs-dl3-hidden")).toBe(true);
  });
  
  it('should show the aid container when activity has aid skills', async () => {
    const activity = { aidSkills: ['Skill1'] };
    // Pre-set the container as hidden.
    const containerDiv = container.find(".cs-dl3-aid-another-container").addClass("cs-dl3-hidden").hide();
    await UI.toggleAidSection(container, activity, { performers: { Hero: 1 }, helpers: [] }, {});
    expect(containerDiv.hasClass("cs-dl3-hidden")).toBe(false);
  });
});

describe('updateActivityUI composite function', () => {
  let container;
  beforeEach(() => {
    container = $(`
      <div>
        <div class="cs-dl3-activity">
          <div class="cs-dl3-activity-options">
            <div class="cs-dl3-aid-helpers-row"></div>
            <div class="cs-dl3-aid-another-container"></div>
            <div class="cs-dl3-checkmark-container"></div>
            <button class="cs-dl3-activity-action">Old Text</button>
          </div>
        </div>
      </div>
    `).appendTo(document.body);
  });
  afterEach(() => {
    container.remove();
  });
  
  it('should update the complete activity UI correctly', async () => {
    const activity = {
      skills: ['Skill1'],
      aidSkills: ['Aid1'],
      useIndependentTracking: false,
      repeatable: false,
      id: 'act1'
    };
    const globalState = { 
      performers: { Hero: 1, Other: 2 }, 
      helpers: ['Ally'] 
    };
    
    // Dummy values/functions for the composite call.
    const defaultPerformText = "Perform Action";
    const performText = "Performed by: Test";
    const artPath = (file) => `/art/${file}`;
    const completedActions = [2]; // e.g. 2 completed actions
    const aids = [1];             // e.g. 1 aid action
    const assignedActor = { name: "TestActor" };
    // Dummy generateSkillChoices function returns an empty array.
    const generateSkillChoices = () => [];
    
    await UI.updateActivityUI(
      container.find(".cs-dl3-activity").eq(0),
      activity,
      globalState,
      defaultPerformText,
      performText,
      artPath,
      completedActions,
      aids,
      0,
      assignedActor,
      generateSkillChoices
    );
    
    // The perform button text should be computed from globalState.
    // For non-independent, non-repeatable, computeButtonState returns
    // "Performed by: <performerText>" where <performerText> from globalState is "Hero".
    expect(container.find(".cs-dl3-activity-action").text()).toContain("Performed by:");
    expect(container.find(".cs-dl3-activity-action").text()).toContain("Hero");
    expect(container.find(".cs-dl3-activity-action").text()).toContain("Other x2");
    
    // Check that the global helpers info is updated via updateGlobalHelpers.
    expect(container.find(".cs-dl3-aid-helpers-row").html()).toContain("Performed by:");
    
    // Check that the checkmark container now contains 2 checkmark images.
    expect(container.find(".cs-dl3-checkmark-container img.cs-dl3-checkmark").length).toBe(3);
    
    // Since activity has aidSkills, the aid container should be visible.
    expect(container.find(".cs-dl3-aid-another-container").hasClass("cs-dl3-hidden")).toBe(false);
  });
});
});


/* ============================
Integration Tests for CampActions
============================ */
describe('CampActions Integration', () => {
  let campActions, mockScene, mockData, mockOptions, html;
  
  beforeEach(() => {
    // Clear document body and set up default data.
    document.body.innerHTML = "";
    mockScene = { id: 'testScene' };
    mockData = {
      activities: [
        { 
          id: 1,
          skills: [{ skill: 'Skill1' }],
          aidSkills: [{ skill: 'Aid1' }],
          timeCost: 2,
          repeatable: true,
          useIndependentTracking: true,
          getSelectionData: () => ({})
        }
      ],
      currentDay: 1,
      assignedActor: {
        id: 'Actor1',
        name: 'Hero',
        system: { abilities: { Skill1: { rank: 1 } }, skills: { Skill1: { rank: 1 } } }
      },
      globalCompletedActions: {}
    };
    mockOptions = {};
    campActions = new CampActions(mockScene, mockData, mockOptions);
    jest.clearAllMocks()
  });
  
  afterEach(() => {
    document.body.innerHTML = "";
  });
  
  describe('updateUI integration for perform button text', () => {
    beforeEach(() => {
      html = $(`
        <form class="cs-dl3-camp-actions">
          <div class="cs-dl3-activity">
            <div class="cs-dl3-activity-options">
              <div class="cs-dl3-perform-container">
                <button type="button" class="cs-dl3-activity-action">Perform Action</button>
              </div>
            </div>
          </div>
        </form>
      `);
      document.body.appendChild(html[0]);
      // For this test, use an activity with non-independent tracking.
      campActions.activities = [{
        id: 'testActivity',
        timeCost: 2,
        repeatable: false,
        useIndependentTracking: false
      }];
    });
    
    it('should display "Perform Action" when no global performers exist', () => {
      campActions.stateManager.state = { 
        testActivity: { performers: {}, helpers: [] } 
      };
      campActions.updateUI(html);
      expect(html.find(".cs-dl3-activity-action").text()).toBe("Perform Action");
    });
    
    it('should display the correct performer text when global performers exist', () => {
      campActions.stateManager.state = { 
        testActivity: { performers: { "Hero": 2, "Ally": 1 }, helpers: [] } 
      };
      campActions.updateUI(html);
      expect(html.find(".cs-dl3-activity-action").text()).toBe("Performed by: Hero x2, Ally");
    });
  });

  describe('activateLockedState integration via UI helper', () => {
    let mockHtml;
    const activities = [{ id: 'testActivity' }];
    let lockedActivities = {};
    
    beforeEach(() => {
      mockHtml = $(`
        <form class="cs-dl3-camp-actions">
          <div class="cs-dl3-activity">
            <div class="cs-dl3-completed-checkbox">
              <input type="checkbox" class="cs-dl3-checkmark" data-action-index="0">
            </div>
          </div>
        </form>
      `);
      document.body.appendChild(mockHtml[0]);
    });
    
    afterEach(() => {
      document.body.innerHTML = "";
    });
    
    it('should add the locked class when an activity is locked', () => {
      lockedActivities = { 0: true };
      UI.activateLockedState(mockHtml, activities, lockedActivities);
      expect(mockHtml.find('.cs-dl3-completed-checkbox').hasClass('cs-dl3-checkbox-locked')).toBe(true);
    });
    
    it('should remove the locked class when an activity is unlocked', () => {
      lockedActivities = { 0: false };
      const checkboxContainer = mockHtml.find('.cs-dl3-completed-checkbox');
      checkboxContainer.addClass('cs-dl3-checkbox-locked');
      UI.activateLockedState(mockHtml, activities, lockedActivities);
      expect(checkboxContainer.hasClass('cs-dl3-checkbox-locked')).toBe(false);
    });
    
    it('should gracefully handle missing elements', () => {
      expect(() =>
        UI.activateLockedState($('<div></div>'), activities, lockedActivities)
      ).not.toThrow();
    });
  });

  describe('_handleUnselectAction Integration', () => {
    let mockEvent, mockHtml, activity;
    beforeEach(() => {
      // Create a basic event and DOM stub
      mockEvent = {
        stopPropagation: jest.fn(),
        currentTarget: $("<div data-action-index='0'></div>"),
      };
      mockHtml = $("<div></div>");
      activity = {
        id: "gatherFirewood",
        title: "Gather Firewood",
        timeCost: 1,
        repeatable: true,
        useIndependentTracking: true
      };
      campActions = new CampActions({ id: "scene1" }, {
        activities: [activity],
        currentDay: 1,
        assignedActor: { id: "actor1", name: "Hero", system: {} },
        globalCompletedActions: {}
      }, {});
      // Set initial state in the state manager.
      campActions.stateManager.state = {
        gatherFirewood: { performers: { Hero: 2, Ally: 1 }, helpers: [] }
      };
    });

    it('should decrement performer count and update state on unselect', async () => {
      await campActions._handleUnselectAction(mockEvent, mockHtml);
      expect(campActions.stateManager.getState().gatherFirewood.performers.Hero).toBe(1);
    });

    it('should remove a performer entry when count reaches zero', async () => {
      campActions.stateManager.state.gatherFirewood.performers.Hero = 1;
      await campActions._handleUnselectAction(mockEvent, mockHtml);
      expect(campActions.stateManager.getState().gatherFirewood.performers.Hero).toBeUndefined();
      expect(campActions.stateManager.getState().gatherFirewood.performers.Ally).toBe(1);
    });

    it('should remove the entire activity record if no performers remain', async () => {
      campActions.stateManager.state.gatherFirewood.performers = { Hero: 1 };
      await campActions._handleUnselectAction(mockEvent, mockHtml);
      expect(campActions.stateManager.getState().gatherFirewood).toBeUndefined();
    });

    it('should not modify state when the activity is locked', async () => {
      campActions.lockedActivities = { 0: true };
      await campActions._handleUnselectAction(mockEvent, mockHtml);
      expect(campActions.stateManager.getState().gatherFirewood.performers.Hero).toBe(2);
      expect(campActions.stateManager.getState().gatherFirewood.performers.Ally).toBe(1);
    });
    
    it('should unselect an unlocked activity and update UI', async () => {
      jest.spyOn(campActions.stateManager, 'unselectActivity').mockResolvedValueOnce();
      jest.spyOn(campActions, 'updateUI').mockResolvedValueOnce();
      await campActions._handleUnselectAction(mockEvent, mockHtml);
      expect(campActions.stateManager.unselectActivity).toHaveBeenCalledWith(activity.id, campActions.assignedActor.name, undefined);
      expect(campActions.updateUI).toHaveBeenCalledWith(mockHtml);
    });
  });


  describe('_handlePerformAction', () => {
    let mockHtml;
  
    beforeEach(() => {
      mockHtml = $('<div><div class="cs-dl3-activity-action" data-action-index="0"></div></div>')
        .appendTo(document.body);
  
      // Mock the function to resolve without doing anything
      updateCurrentCampActions.mockResolvedValue();
    });
  
    afterEach(() => {
      mockHtml.remove();
      jest.clearAllMocks(); // Clear mock calls between tests
    });
  
    it('should update global state and increment local actions for independent tracking', async () => {
      const event = { currentTarget: mockHtml.find('.cs-dl3-activity-action')[0] };
      jest.spyOn(campActions, 'updateUI').mockResolvedValueOnce();

      await campActions._handlePerformAction(event, mockHtml);
  
      // Verify that the mocked updateCurrentCampActions was called
      expect(updateCurrentCampActions).toHaveBeenCalledWith(campActions.object, campActions.stateManager.getState());
  
      // Ensure local state is updated properly
      expect(campActions.completedActions[0]).toBe(1);
  
      // Verify that the UI is updated
      expect(campActions.updateUI).toHaveBeenCalledWith(mockHtml);
    });
  
    it('should execute onUserPerform and lock the activity', async () => {
      // Set up the onUserPerform mock function to simulate a resolved callback
      campActions.activities[0].onUserPerform = jest.fn().mockResolvedValueOnce();
      jest.spyOn(campActions, 'updateUI').mockResolvedValueOnce();
  
      const event = { currentTarget: mockHtml.find('.cs-dl3-activity-action')[0] };
      await campActions._handlePerformAction(event, mockHtml);
  
      // Verify that the onUserPerform callback was executed
      expect(campActions.activities[0].onUserPerform).toHaveBeenCalled();
  
      // Verify that the activity was locked
      expect(campActions.lockedActivities[0]).toBe(true);
  
      // Verify that the mocked updateCurrentCampActions was called
      expect(updateCurrentCampActions).toHaveBeenCalledWith(campActions.object, campActions.stateManager.getState());
  
      // Verify that the UI is updated
      expect(campActions.updateUI).toHaveBeenCalledWith(mockHtml);
    });
  });

  describe('_toggleDetails', () => {
    let mockHtml;
  
    beforeEach(() => {
      mockHtml = $(`
        <div class="cs-dl3-activity">
          <div class="cs-dl3-activity-details"></div>
          <div class="cs-dl3-details-toggle"><i class="fa-circle-caret-down"></i></div>
        </div>
      `).appendTo(document.body);
    });
  
    afterEach(() => {
      mockHtml.remove();
    });
  
    it('should toggle the details visibility', () => {
      const event = { currentTarget: mockHtml.find('.cs-dl3-details-toggle')[0] };
      campActions._toggleDetails(event);
      expect(mockHtml.find('.cs-dl3-activity-details').hasClass('cs-dl3-hidden')).toBe(true);
      expect(mockHtml.find('.cs-dl3-details-toggle i').hasClass('fa-circle-caret-up')).toBe(true);
      expect(mockHtml.find('.cs-dl3-details-toggle i').hasClass('fa-circle-caret-down')).toBe(false);
      campActions._toggleDetails(event);
      expect(mockHtml.find('.cs-dl3-activity-details').hasClass('cs-dl3-hidden')).toBe(false);
      expect(mockHtml.find('.cs-dl3-details-toggle i').hasClass('fa-circle-caret-down')).toBe(true);
      expect(mockHtml.find('.cs-dl3-details-toggle i').hasClass('fa-circle-caret-up')).toBe(false);
    });
  });

});
