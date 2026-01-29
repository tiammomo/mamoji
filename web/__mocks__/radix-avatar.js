/**
 * Mock for @radix-ui/react-avatar
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Root = Object.assign(createMockComponent('Avatar'), { displayName: 'Avatar' });
const Image = createMockComponent('AvatarImage');
const Fallback = createMockComponent('AvatarFallback');

module.exports = {
  default: {
    Root,
    Image,
    Fallback,
  },
  Root,
  Image,
  Fallback,
};
