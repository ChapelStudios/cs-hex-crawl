// tests/mocks/mockCanvas.js
const mockCanvas = {
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

export default mockCanvas;
