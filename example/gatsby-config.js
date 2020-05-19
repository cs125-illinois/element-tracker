const path = require("path")

module.exports = {
  pathPrefix: "/element-tracker",
  plugins: [
    "@cs125/gatsby-theme-cs125-docs",
    {
      resolve: "gatsby-alias-imports",
      options: {
        aliases: {
          react: "./node_modules/react",
          "@cs125/element-tracker": "..",
          "@components": "./src/components",
        },
      },
    },
  ],
}
