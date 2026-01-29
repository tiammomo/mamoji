/**
 * Mock for @radix-ui/react-dialog
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Root = createMockComponent('DialogRoot');
const Trigger = createMockComponent('DialogTrigger');
const Portal = createMockComponent('DialogPortal');
const Overlay = Object.assign(createMockComponent('DialogOverlay'), { displayName: 'DialogOverlay' });
const Content = Object.assign(createMockComponent('DialogContent'), { displayName: 'DialogContent' });
const Title = createMockComponent('DialogTitle');
const Description = createMockComponent('DialogDescription');
const Close = createMockComponent('DialogClose');

module.exports = {
  default: {
    Root,
    Trigger,
    Portal,
    Overlay,
    Content,
    Title,
    Description,
    Close,
  },
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
};
