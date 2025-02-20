import { refugeeTypes } from "../../constants/moveCosts.js";
import { requestRefugees, returnRefugees } from "../../factions/factions.js";
import { 
  getPartyMemberList, 
  setGroupTokenOwner, 
  getCampToken, 
  getPartyTokens, 
  initGroupConfig, 
  getIndexedParties,
  getCampConfig,
  getPopulationTotals
} from "../../repos/gameSettings.js";

const UNASSIGNED = 'Unassigned';

const getGroupIdByPartyMember = (currentGroups, actorId) => {
  for (const groupId in currentGroups) {
    if (currentGroups[groupId]?.partyMembers?.includes(actorId)) {
      return groupId;
    }
  }

  return UNASSIGNED;
};

const calculateChanges = (formData, previousGroups, group, changes) => {
  const newForagers = parseInt(formData[`${group.id}-foragers`] || 0);
  const newWarriors = parseInt(formData[`${group.id}-warriors`] || 0);
  const newInfirm = parseInt(formData[`${group.id}-infirm`] || 0);
  const newRefugees = parseInt(formData[`${group.id}-refugees`] || 0);

  const prevGroup = previousGroups[group.id] || {};
  const prevForagers = prevGroup.foragers || 0;
  const prevWarriors = prevGroup.warriors || 0;
  const prevInfirm = prevGroup.infirm || 0;
  const prevRefugees = prevGroup.refugees || 0;

  // Calculate changes
  changes.added.foragers += Math.max(0, newForagers - prevForagers);
  changes.added.warriors += Math.max(0, newWarriors - prevWarriors);
  changes.added.infirm += Math.max(0, newInfirm - prevInfirm);
  changes.added.refugees += Math.max(0, newRefugees - prevRefugees);

  changes.removed.foragers += Math.max(0, prevForagers - newForagers);
  changes.removed.warriors += Math.max(0, prevWarriors - newWarriors);
  changes.removed.infirm += Math.max(0, prevInfirm - newInfirm);
  changes.removed.refugees += Math.max(0, prevRefugees - newRefugees);

  return {
    foragers: newForagers,
    warriors: newWarriors,
    infirm: newInfirm,
    refugees: newRefugees,
  };
};

const updateGroupTokenOwners = async (groups, partyTokens, campToken) => {
  const jobs = [];
  for (const group of [...partyTokens, campToken]) {
    jobs.push(setGroupTokenOwner(group.id, groups[group.id]?.partyMembers ?? []));
  }
  await Promise.all(jobs);
};

export class PartyManager extends FormApplication {
  /** 
  * @override
  */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id:"cs-hex-init-form",
      title: "Hex Crawl Party Manager",
      template: "modules/dragonlance35/modules/hexcrawl/views/partyManager/partyManager.hbs",
      classes: [],
      width: 'auto',
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: true,
      resizable: true,
    });
  }
  
  /** 
  * @override
  */
  getData(options) {
    const currentGroups = {
      ...getIndexedParties(this.options.partyTokens),
      [this.options.campToken.id]: {
        ...this.options.campConfig,
        class: 'hidden',
      },
    };

    const tokenOptions = [...this.options.partyTokens, this.options.campToken]
      .reduce((result, nextToken) => {
        result[nextToken.id] = nextToken.name
        return result;
      }, {});
    tokenOptions[UNASSIGNED] = UNASSIGNED;

    const partyMembers = getPartyMemberList().map(pm => {
      let groupId = getGroupIdByPartyMember(currentGroups, pm.id);
      return {
        name: pm.name,
        id: pm.id,
        group: groupId,
      };
    });

    return {
      partyMembers,
      tokenOptions,
      population: Object.values(currentGroups),
      maxPopulationData: this.options.maxPopulationData,
      campData: this.options.campConfig,
    };
  };

  /** 
  * @override
  * Object is the scene
  */
  async _updateObject(event, formData) {
    const updatedGroups = {};
    const previousGroups = getIndexedParties(this.options.partyTokens);
    previousGroups[this.options.campToken.id] = getCampConfig(this.object, this.options.campToken);
    const groupChanges = {};

    // Track changes in refugee numbers
    this.options.partyTokens.forEach(group => {
      groupChanges[group.id] = {
        added: {
          [refugeeTypes.foragers]: 0,
          [refugeeTypes.warriors]: 0,
          [refugeeTypes.infirm]: 0,
          [refugeeTypes.refugees]: 0,
        },
        removed: {
          [refugeeTypes.foragers]: 0,
          [refugeeTypes.warriors]: 0,
          [refugeeTypes.infirm]: 0,
          [refugeeTypes.refugees]: 0,
        },
      };
    });

    for (const partyMember of getPartyMemberList()) {
      const groupId = formData[partyMember.id] || UNASSIGNED;
      if (groupId === UNASSIGNED) {
        continue;
      }

      updatedGroups[groupId] = {
        ...(updatedGroups[groupId] || {}),
        partyMembers: [
          ...(updatedGroups[groupId]?.partyMembers || []),
          partyMember.id,
        ],
      };
    }

    for (const group of this.options.partyTokens) {
      updatedGroups[group.id] = {
        ...(updatedGroups[group.id] || {}),
        ...calculateChanges(formData, previousGroups, group, groupChanges[group.id]),
      };
    }

    // Function to combine distributions
    const combineDistributions = (dist1, dist2) => {
      const combined = { ...dist1 };
      for (const faction in dist2) {
        if (!combined[faction]) {
          combined[faction] = dist2[faction];
        } else {
          for (const type in dist2[faction]) {
            combined[faction][type] = (combined[faction][type] || 0) + dist2[faction][type];
          }
        }
      }
      return combined;
    };

    // Handle individual refugee changes for each group
    for (const groupId in groupChanges) {
      const changes = groupChanges[groupId];
      const request = {};
      const returns = {};
  
      Object.keys(changes.added).forEach(type => {
        if (changes.added[type] > 0) {
          request[type] = changes.added[type];
        }
      });
  
      Object.keys(changes.removed).forEach(type => {
        if (changes.removed[type] > 0) {
          returns[type] = changes.removed[type];
        }
      });
  
      if (Object.keys(request).length > 0) {
        const requestDistribution = await requestRefugees(this.object, request);
        updatedGroups[groupId].distribution = combineDistributions(
          updatedGroups[groupId].distribution,
          requestDistribution.distribution
        );
      }
  
      if (Object.keys(returns).length > 0) {
        const returnDistribution = await returnRefugees(this.object, returns);
        updatedGroups[groupId].distribution = combineDistributions(
          updatedGroups[groupId].distribution,
          returnDistribution.distribution
        );
      }
    }

    await Promise.all([
      initGroupConfig(this.object, updatedGroups),
      updateGroupTokenOwners(updatedGroups, this.options.partyTokens, this.options.campToken),
    ]);
  }

  /** 
  * @override
  */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".cancel-btn").click(this._onCancel.bind(this));

    // Find all input fields and bind the blur event to update the unassigned value  const excludePrefix = this.options.campToken._id;

    const excludePrefix = this.options.campToken._id;

    // Foragers
    html.find(`input[name$="-${refugeeTypes.foragers}"]`)
      .filter((_, x) => !x.name.startsWith(excludePrefix))
      .each((_, x) => {
        $(x).on('blur', () => this._updateUnassigned(refugeeTypes.foragers, html));
      });
  
    // Warriors
    html.find(`input[name$="-${refugeeTypes.warriors}"]`)
      .filter((_, x) => !x.name.startsWith(excludePrefix))
      .each((_, x) => {
        $(x).on('blur', () => this._updateUnassigned(refugeeTypes.warriors, html));
      });
  
    // Infirm
    html.find(`input[name$="-${refugeeTypes.infirm}"]`)
      .filter((_, x) => !x.name.startsWith(excludePrefix))
      .each((_, x) => {
        $(x).on('blur', () => this._updateUnassigned(refugeeTypes.infirm, html));
      });
  
    // Refugees
    html.find(`input[name$="-${refugeeTypes.refugees}"]`)
      .filter((_, x) => !x.name.startsWith(excludePrefix))
      .each((_, x) => {
        $(x).on('blur', () => this._updateUnassigned(refugeeTypes.refugees, html));  
      });
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _updateUnassigned(fieldType, html) {
    const excludePrefix = this.options.campToken._id;
    let total = 0;
  
    // Calculate total assigned values for the specified field type
    html.find(`input[name$="-${fieldType}"]`)
      .filter((_, x) => !x.name.startsWith(excludePrefix))
      .each((_, element) => {
        total += parseInt(element.value || 0);
      });
  
    // Update unassigned value for the specified field type
    const remaining = (this.options.maxPopulationData?.[fieldType] ?? 0) - total;
    html.find(`input[name="${excludePrefix}-${fieldType}"]`)[0].value = remaining;
    html.find(`#${excludePrefix}-${fieldType}`).text(remaining);
  }
}

export const launchPartyManager = (scene) => {
  const campToken = getCampToken(scene);
  const partyManager = new PartyManager(scene, {
    campToken,
    partyTokens: getPartyTokens(scene),
    campConfig: getCampConfig(scene, campToken),
    maxPopulationData: getPopulationTotals(scene),
  });

  partyManager.render(true, { width: 500 });
  return partyManager;
};