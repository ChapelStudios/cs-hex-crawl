import $ from 'jquery';
import mockCanvas from './mocks/canvas.js';

globalThis.FormApplication = class {
  constructor(object, options) {
    this.object = object;
    this.options = options;
  }
  render() {
    console.log("Mock render method called");
  }
  close() {
    console.log("Mock close method called");
  }
};

globalThis.$ = $;
globalThis.jQuery = $;

globalThis.canvas = {
  dimensions: {
    width: 1920,
    height: 1080,
    size: 100,
    sceneRect: { x: 0, y: 0, width: 1920, height: 1080 },
  },
  stage: {
    addChild: jest.fn(),
    removeChild: jest.fn(),
  },
  tokens: {
    get: jest.fn(),
    placeables: [],
  },
  layers: {
    controls: {
      visible: false,
    },
  },
  hud: {
    update: jest.fn(),
  },
  draw: jest.fn(),
  scene: 'something',
};

globalThis.ui = {
  notifications: {
      info: jest.fn(),
      warn: jest.fn(),
  },
};

globalThis.game = {
    user: {
        isGM: true, // You can toggle this value to simulate GM or non-GM users
    },
};

// At the top of your test file
jest.mock('../src/helpers/display.js', () => ({
  registerPartial: jest.fn(),  // It will just be a spy that does nothing.
  loadStylesheet: jest.fn()      // Ditto.
}));
