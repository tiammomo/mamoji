// Mock for @radix-ui/react-slot
const React = require('react');

// Get the first valid React element child
const getFirstElement = (children) => {
  if (!children) return null;
  if (React.isValidElement(children)) return children;

  // Handle arrays of children
  if (Array.isArray(children)) {
    return children.find(React.isValidElement) || null;
  }

  return null;
};

const Slot = React.forwardRef(({ children, ...props }, ref) => {
  const child = getFirstElement(children);
  if (child) {
    return React.cloneElement(child, { ...props, ref });
  }
  return children;
});

Slot.displayName = 'Slot';

const createSlot = (props) => {
  const { children, ...rest } = props;
  const child = getFirstElement(children);
  if (child) {
    return React.cloneElement(child, rest);
  }
  return children;
};

module.exports = {
  Slot,
  createSlot,
};
