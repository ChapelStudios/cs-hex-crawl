module.exports = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.m?[jt]sx?$": "babel-jest", // Handles JavaScript, TypeScript, and JSX
    // "^.+\\.vue$": "@vue/vue3-jest"    // Handles Vue files
  },
  testRegex: [
    ".*(src|tests).*\.(test|spec)\.m?[jt]sx?$",
  ], // Regex for inline tests and standard formats
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "mjs", "vue"], // Supported extensions
  setupFiles: ["./tests/jest.setup.js"], // Optional: global setup
  transformIgnorePatterns: ["/node_modules/(?!(node-fetch)/)"],
};
