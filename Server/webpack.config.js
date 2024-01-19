const path = require("path");

const config = () => {
  return {
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "main.js",
    },
  };
};

module.exports = config;
