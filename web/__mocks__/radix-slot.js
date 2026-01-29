/**
 * Mock for @radix-ui/react-slot
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Slot = createMockComponent('Slot');

module.exports = {
  default: {
    Slot,
  },
  Slot,
};
