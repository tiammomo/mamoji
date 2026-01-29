/**
 * Mock for @radix-ui/react-tabs
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Root = createMockComponent('TabsRoot');
const List = Object.assign(createMockComponent('TabsList'), { displayName: 'TabsList' });
const Trigger = createMockComponent('TabsTrigger');
const Content = Object.assign(createMockComponent('TabsContent'), { displayName: 'TabsContent' });

module.exports = {
  default: {
    Root,
    List,
    Trigger,
    Content,
  },
  Root,
  List,
  Trigger,
  Content,
};
