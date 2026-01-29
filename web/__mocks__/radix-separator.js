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

const Root = Object.assign(createMockComponent('Separator'), { displayName: 'Separator' });

module.exports = {
  default: {
    Root,
  },
  Root,
};
