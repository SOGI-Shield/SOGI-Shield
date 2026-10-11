import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

const eslintConfig = [
  nextPlugin.configs["core-web-vitals"],
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "node_modules/**",
      "public/**",
      "dist/**",
      "out/**"
    ]
  }
];

export default eslintConfig;
