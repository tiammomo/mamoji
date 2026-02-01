import next from "eslint-config-next";

const config = [
  ...next,
  {
    rules: {
      // Allow synchronous state updates in useEffect for redirects
      "react-hooks/set-state-in-effect": "off",
      // Allow img elements in test files
      "@next/next/no-img-element": "off",
      // Allow missing alt text in test files
      "jsx-a11y/alt-text": "off",
      // Ignore missing display name in test mocks
      "react/display-name": "off",
    },
  },
];

export default config;
