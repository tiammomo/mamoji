/**
 * Mock for @radix-ui/react-separator
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

// Create Root component with displayName
const Root = Object.assign(createMockComponent('Separator'), {
  displayName: 'Separator',
});

module.exports = {
  Root,
  Separator: Root,  // also export as Separator for some imports
  default: {
    Root,
    Separator: Root,
  },
};
