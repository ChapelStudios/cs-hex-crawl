import { updateToken } from "../helpers/update.js";

const defaultGameClock = Object.freeze({
  currentHours: 0,
  lastRandomCheck: null,
});

export const resetGameClock = async (tokens) => {
  const jobs = tokens.map(t => setGameClock(t, {
    ['flags.hexCrawl.gameClock']: {
      ...defaultGameClock,
    },
  }));
  await Promise.all(jobs);
};

export const initGameClock = async (tokens, initTime) => {
  const jobs = tokens.map(t => setGameClock(t, {
    ...defaultGameClock,
    currentHours: initTime,
  }));
  await Promise.all(jobs);
};

export const setGameClock = async (token, gameClockUpdate) => await updateToken(token, {
  ['flags.hexCrawl.gameClock']: {
    ...(token?.flags.hexCrawl?.gameClock ?? {}),
    ...gameClockUpdate,
  },
});

export const getGameClock = (token) => token?.flags.hexCrawl?.gameClock ?? { ...defaultGameClock };
export const getCurrentHours = (token) => getGameClock(token).currentHours;
export const getCurrentDay = (token) => Math.ceil(getCurrentHours(token) / 24);

export const adjustGameClock = async (token, adjustmentAmount) => await setGameClock(token, {
  currentHours: (getGameClock(token)?.currentHours ?? 0) + adjustmentAmount,
});
