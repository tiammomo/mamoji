/**
 * Mock for @radix-ui/react-select
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

const Root = createMockComponent('SelectRoot');
const Group = createMockComponent('SelectGroup');
const Value = createMockComponent('SelectValue');
const Trigger = createMockComponent('SelectTrigger');
const Icon = createMockComponent('SelectIcon');
const Portal = createMockComponent('SelectPortal');
const Content = createMockComponent('SelectContent');
const Viewport = createMockComponent('SelectViewport');
const Item = createMockComponent('SelectItem');
const ItemText = createMockComponent('SelectItemText');
const ItemIndicator = createMockComponent('SelectItemIndicator');
const ScrollUpButton = createMockComponent('SelectScrollUpButton');
const ScrollDownButton = createMockComponent('SelectScrollDownButton');
const Separator = createMockComponent('SelectSeparator');
const Label = createMockComponent('SelectLabel');

module.exports = {
  default: {
    Root,
    Group,
    Value,
    Trigger,
    Icon,
    Portal,
    Content,
    Viewport,
    Item,
    ItemText,
    ItemIndicator,
    ScrollUpButton,
    ScrollDownButton,
    Separator,
    Label,
  },
  Root,
  Group,
  Value,
  Trigger,
  Icon,
  Portal,
  Content,
  Viewport,
  Item,
  ItemText,
  ItemIndicator,
  ScrollUpButton,
  ScrollDownButton,
  Separator,
  Label,
};
