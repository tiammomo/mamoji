// Complete mock for @radix-ui/react-select
const React = require('react');

const createMockComponent = (name) => {
  return React.forwardRef((props, ref) => {
    return React.createElement('div', {
      ref,
      'data-testid': name,
      'data-displayname': name,
      ...props,
    });
  });
};

// Create all required primitives with displayName property
const Trigger = createMockComponent('SelectTrigger');
Trigger.displayName = 'SelectTrigger';

const ScrollUpButton = createMockComponent('SelectScrollUpButton');
ScrollUpButton.displayName = 'SelectScrollUpButton';

const ScrollDownButton = createMockComponent('SelectScrollDownButton');
ScrollDownButton.displayName = 'SelectScrollDownButton';

const Content = createMockComponent('SelectContent');
Content.displayName = 'SelectContent';

const Value = createMockComponent('SelectValue');
Value.displayName = 'SelectValue';

const Item = createMockComponent('SelectItem');
Item.displayName = 'SelectItem';

const ItemText = createMockComponent('SelectItemText');
ItemText.displayName = 'SelectItemText';

const Label = createMockComponent('SelectLabel');
Label.displayName = 'SelectLabel';

const Separator = createMockComponent('SelectSeparator');
Separator.displayName = 'SelectSeparator';

const Viewport = createMockComponent('SelectViewport');
Viewport.displayName = 'SelectViewport';

const Group = createMockComponent('SelectGroup');
Group.displayName = 'SelectGroup';

const Root = createMockComponent('SelectRoot');
Root.displayName = 'SelectRoot';

const Portal = createMockComponent('SelectPortal');
Portal.displayName = 'SelectPortal';

const ItemIndicator = createMockComponent('SelectItemIndicator');
ItemIndicator.displayName = 'SelectItemIndicator';

const Icon = ({ children }) => children;
Icon.displayName = 'SelectIcon';

// Export as namespace import
const SelectPrimitive = Object.assign(
  {
    Root,
    Trigger,
    Value,
    Content,
    Item,
    ItemText,
    ItemIndicator,
    Label,
    Separator,
    ScrollUpButton,
    ScrollDownButton,
    Viewport,
    Group,
    Portal,
    Icon,
  },
  {
    Root,
    Trigger,
    Value,
    Content,
    Item,
    ItemText,
    ItemIndicator,
    Label,
    Separator,
    ScrollUpButton,
    ScrollDownButton,
    Viewport,
    Group,
    Portal,
    Icon,
  }
);

// Re-exported components for direct imports
const Select = Root;
const SelectTrigger = Trigger;
const SelectValue = Value;
const SelectContent = Content;
const SelectItem = Item;
const SelectItemText = ItemText;
const SelectLabel = Label;
const SelectSeparator = Separator;
const SelectScrollUpButton = ScrollUpButton;
const SelectScrollDownButton = ScrollDownButton;
const SelectViewport = Viewport;
const SelectGroup = Group;

module.exports = SelectPrimitive;
module.exports.SelectPrimitive = SelectPrimitive;
module.exports.default = SelectPrimitive;
module.exports.Select = Select;
module.exports.SelectTrigger = SelectTrigger;
module.exports.SelectValue = SelectValue;
module.exports.SelectContent = SelectContent;
module.exports.SelectItem = SelectItem;
module.exports.SelectItemText = SelectItemText;
module.exports.SelectLabel = SelectLabel;
module.exports.SelectSeparator = SelectSeparator;
module.exports.SelectScrollUpButton = SelectScrollUpButton;
module.exports.SelectScrollDownButton = SelectScrollDownButton;
module.exports.SelectViewport = SelectViewport;
module.exports.SelectGroup = SelectGroup;
