/**
 * Mock for @radix-ui/react-toast
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Provider = createMockComponent('ToastProvider');
const Root = Object.assign(createMockComponent('Toast'), { displayName: 'Toast' });
const Viewport = createMockComponent('ToastViewport');
const Title = createMockComponent('ToastTitle');
const Description = createMockComponent('ToastDescription');
const Action = createMockComponent('ToastAction');
const Close = createMockComponent('ToastClose');

module.exports = {
  default: {
    Provider,
    Root,
    Viewport,
    Title,
    Description,
    Action,
    Close,
  },
  Provider,
  Root,
  Viewport,
  Title,
  Description,
  Action,
  Close,
};
