/**
 * Mock for all @radix-ui/react-* primitives
 * This provides stub components for radix-ui primitives used by shadcn/ui components
 * in the jsdom test environment.
 */
const React = require('react');

const createMockComponent = (name) => {
  const Mock = React.forwardRef(({ children, ...props }, ref) => {
    return React.createElement('div', { ref, ...props }, children);
  });
  Mock.displayName = name;
  return Mock;
};

// Avatar primitive - Root directly on the object
const AvatarRoot = Object.assign(createMockComponent('Avatar'), { displayName: 'Avatar' });
const AvatarImage = createMockComponent('AvatarImage');
const AvatarFallback = createMockComponent('AvatarFallback');

// Progress primitive - Root directly on the object
const ProgressRoot = Object.assign(createMockComponent('Progress'), { displayName: 'Progress' });
const ProgressIndicator = createMockComponent('ProgressIndicator');

// Label primitive - Root directly on the object
const LabelRoot = Object.assign(createMockComponent('Label'), { displayName: 'Label' });

// Toast primitive - Root directly on the object
const ToastProvider = createMockComponent('ToastProvider');
const ToastRoot = Object.assign(createMockComponent('Toast'), { displayName: 'Toast' });
const ToastViewport = createMockComponent('ToastViewport');
const ToastTitle = createMockComponent('ToastTitle');
const ToastDescription = createMockComponent('ToastDescription');
const ToastAction = createMockComponent('ToastAction');
const ToastClose = createMockComponent('ToastClose');

// Separator primitive - Root directly on the object
const SeparatorRoot = Object.assign(createMockComponent('Separator'), { displayName: 'Separator' });

// Default export object - used when package is imported as default
module.exports = {
  // Avatar primitive
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  displayName: 'Avatar',

  // Progress primitive
  ProgressRoot,
  ProgressIndicator,

  // Label primitive
  LabelRoot,

  // Toast primitive
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,

  // Separator primitive
  SeparatorRoot,

  // Slot primitive (for @radix-ui/react-slot)
  Slot: createMockComponent('Slot'),

  // Select primitive components
  SelectRoot: createMockComponent('SelectRoot'),
  SelectGroup: createMockComponent('SelectGroup'),
  SelectValue: createMockComponent('SelectValue'),
  SelectTrigger: createMockComponent('SelectTrigger'),
  SelectIcon: createMockComponent('SelectIcon'),
  SelectPortal: createMockComponent('SelectPortal'),
  SelectContent: createMockComponent('SelectContent'),
  SelectViewport: createMockComponent('SelectViewport'),
  SelectItem: createMockComponent('SelectItem'),
  SelectItemText: createMockComponent('SelectItemText'),
  SelectItemIndicator: createMockComponent('SelectItemIndicator'),
  SelectScrollUpButton: createMockComponent('SelectScrollUpButton'),
  SelectScrollDownButton: createMockComponent('SelectScrollDownButton'),
  SelectSeparator: createMockComponent('SelectSeparator'),
  SelectLabel: createMockComponent('SelectLabel'),

  // Dialog primitive components
  DialogRoot: createMockComponent('DialogRoot'),
  DialogTrigger: createMockComponent('DialogTrigger'),
  DialogPortal: createMockComponent('DialogPortal'),
  DialogOverlay: createMockComponent('DialogOverlay'),
  DialogContent: createMockComponent('DialogContent'),
  DialogTitle: createMockComponent('DialogTitle'),
  DialogDescription: createMockComponent('DialogDescription'),
  DialogClose: createMockComponent('DialogClose'),
  DialogHeader: createMockComponent('DialogHeader'),
  DialogFooter: createMockComponent('DialogFooter'),

  // Tabs primitive - use List, Root, Trigger, Content (not TabsList, TabsRoot, etc.)
  Root: createMockComponent('TabsRoot'),
  List: Object.assign(createMockComponent('TabsList'), { displayName: 'TabsList' }),
  Trigger: createMockComponent('TabsTrigger'),
  Content: Object.assign(createMockComponent('TabsContent'), { displayName: 'TabsContent' }),

  // Popover primitive components
  PopoverRoot: createMockComponent('PopoverRoot'),
  PopoverAnchor: createMockComponent('PopoverAnchor'),
  PopoverContent: createMockComponent('PopoverContent'),
  PopoverTrigger: createMockComponent('PopoverTrigger'),
  PopoverPortal: createMockComponent('PopoverPortal'),

  // DropdownMenu primitive components
  DropdownMenuRoot: createMockComponent('DropdownMenuRoot'),
  DropdownMenuTrigger: createMockComponent('DropdownMenuTrigger'),
  DropdownMenuPortal: createMockComponent('DropdownMenuPortal'),
  DropdownMenuContent: createMockComponent('DropdownMenuContent'),
  DropdownMenuItem: createMockComponent('DropdownMenuItem'),
  DropdownMenuGroup: createMockComponent('DropdownMenuGroup'),
  DropdownMenuLabel: createMockComponent('DropdownMenuLabel'),
  DropdownMenuSeparator: createMockComponent('DropdownMenuSeparator'),

  // Tooltip primitive components
  TooltipProvider: createMockComponent('TooltipProvider'),
  TooltipRoot: createMockComponent('TooltipRoot'),
  TooltipTrigger: createMockComponent('TooltipTrigger'),
  TooltipPortal: createMockComponent('TooltipPortal'),
  TooltipContent: createMockComponent('TooltipContent'),

  // Checkbox
  Checkbox: createMockComponent('Checkbox'),

  // Switch
  Switch: createMockComponent('Switch'),

  // RadioGroup primitive components
  RadioGroupRoot: createMockComponent('RadioGroupRoot'),
  RadioGroupItem: createMockComponent('RadioGroupItem'),
  RadioGroupIndicator: createMockComponent('RadioGroupIndicator'),

  // ScrollArea primitive components
  ScrollAreaRoot: createMockComponent('ScrollAreaRoot'),
  ScrollAreaViewport: createMockComponent('ScrollAreaViewport'),
  ScrollAreaScrollbar: createMockComponent('ScrollAreaScrollbar'),
  ScrollAreaThumb: createMockComponent('ScrollAreaThumb'),
  ScrollAreaCorner: createMockComponent('ScrollAreaCorner'),

  // Context primitives
  createContext: () => ({ Provider: createMockComponent('ContextProvider'), _defaultValue: null }),
  useContext: () => ({}),

  // RovingFocusGroup exports
  RovingFocusGroupRoot: createMockComponent('RovingFocusGroupRoot'),
  RovingFocusGroupItem: createMockComponent('RovingFocusGroupItem'),
  RovingFocusGroupCollectionSlot: createMockComponent('RovingFocusGroupCollectionSlot'),
};
