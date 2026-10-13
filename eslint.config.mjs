import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

// Shim for ESLint 10 compatibility where context.getCwd() was replaced by context.cwd
const patchedNextRules = Object.fromEntries(
  Object.entries(nextPlugin.rules || {}).map(([ruleName, ruleDef]) => {
    return [
      ruleName,
      {
        ...ruleDef,
        create(context) {
          const proxiedContext = new Proxy(context, {
            get(target, prop, receiver) {
              if (prop === "getCwd") {
                return () => target.cwd || process.cwd();
              }
              if (prop === "getFilename") {
                return () => target.filename;
              }
              if (prop === "getPhysicalFilename") {
                return () => target.physicalFilename || target.filename;
              }
              if (prop === "getSourceCode") {
                return () => target.sourceCode;
              }
              if (prop === "getScope") {
                return (node) => target.sourceCode?.getScope?.(node || target.sourceCode.ast);
              }
              return Reflect.get(target, prop, receiver);
            },
          });
          return ruleDef.create(proxiedContext);
        },
      },
    ];
  })
);

const patchedNextPlugin = {
  ...nextPlugin,
  rules: patchedNextRules,
};

const eslintConfig = [
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": patchedNextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@next/next/no-duplicate-head": "off",
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
