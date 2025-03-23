module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" }, // Ensure compatibility with the active Node.js version
      },
    ],
    "@babel/preset-typescript" // Keep this if you're using TypeScript
  ],
};
