/**
 * Mock for @radix-ui/react-progress
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Root = Object.assign(createMockComponent('Progress'), { displayName: 'Progress' });
const Indicator = createMockComponent('ProgressIndicator');

module.exports = {
  default: {
    Root,
    Indicator,
  },
  Root,
  Indicator,
};
