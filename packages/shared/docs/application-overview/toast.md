# Toast Component

*Comprehensive documentation for the Toast component, a global notification system that provides user feedback and system messaging throughout the D&D Tools application.*

## 📋 **Overview**

The Toast component provides a global notification system that enables any component in the application to display user-friendly notifications, success messages, error feedback, and system alerts. The system is built on top of the base UI toast library and provides a consistent, accessible notification experience across the entire application.

The component integrates seamlessly with other systems, particularly the Dice Box system, to automatically display dice roll results and other application events with consistent formatting and user-friendly styling.

**Source Files**:
- [ToastProvider.tsx](../../../apps/frontend/src/components/toast/ToastProvider.tsx) - Main provider component for global toast state management
- [GenericToast.tsx](../../../apps/frontend/src/components/toast/GenericToast.tsx) - Individual toast rendering component
- [useToast.ts](../../../apps/frontend/src/components/toast/useToast.ts) - React hook for accessing toast functionality
- [index.ts](../../../apps/frontend/src/components/toast/index.ts) - Component exports and public API

## 🏗️ **Component Architecture**

The Toast component follows the shared [Frontend Component Architecture](frontend-components.md) with notification-specific implementations:

**Provider Pattern**: Global React context provider for application-wide access
**Hook Pattern**: Custom React hook for easy component integration
**State Management**: Centralized state management with automatic cleanup
**UI Integration**: Seamless integration with application layout and styling

### **Component Structure**

**ToastProvider**: Global provider that manages toast state and provides context
**GenericToast**: Individual toast rendering component with formatting and styling
**useToast**: Custom hook for accessing toast functionality from any component
**ToastList**: Internal component that manages toast display and positioning

## 🔧 **Core Features**

### **Global Notification System**

The Toast component provides a centralized notification system that any component can access:

**Universal Access**: Any component can add toast notifications using the `useToast` hook
**Automatic Management**: Toast notifications are automatically managed and cleaned up
**Type Support**: Supports different toast types with appropriate styling and behavior
**Rich Content**: Support for complex formatted content including React elements

### **User Interface Features**

The Toast component provides an intuitive and accessible user interface:

**Fixed Positioning**: Toast notifications appear in the bottom-right corner of the viewport
**Smooth Animations**: Smooth entrance and exit animations for better user experience
**Swipe Dismissal**: Users can swipe up to dismiss toast notifications
**Auto-dismiss**: Toast notifications automatically dismiss after a configurable duration
**Stack Management**: Multiple toasts are stacked with proper spacing and z-index management

### **Integration Capabilities**

The Toast component integrates seamlessly with other application systems:

**Dice Box Integration**: Automatically displays dice roll results with formatted content
**Log Panel Integration**: Shares formatting patterns with the log panel system
**Layout Integration**: Integrated into the main application layout for global access
**Dark Mode Support**: Fully supports dark mode styling and theming

## 🔧 **Component Usage**

### **Adding Toast Notifications**

Components can easily add toast notifications using the `useToast` hook. The hook provides a simple interface for adding different types of toast notifications with optional custom data and formatting.

**Basic Toast**: Add simple informational messages with automatic styling
**Typed Toasts**: Add success, warning, or error messages with appropriate styling
**Rich Content**: Include custom formatted content for complex notifications
**Custom Data**: Include custom data for complex toast notifications with formatted display

### **Toast Notification Types**

The Toast component supports multiple notification types for different purposes:

**Default Toasts**: Standard informational messages for general application events
**Success Toasts**: Successful operations and positive outcomes
**Warning Toasts**: Warning messages for potential issues or user guidance
**Error Toasts**: Error messages for failed operations or system issues

### **Toast Management**

The Toast component provides comprehensive management capabilities:

**Toast Limits**: Configurable maximum number of concurrent toasts (default: 5)
**Auto-dismiss**: Automatic dismissal after configurable duration
**Manual Dismissal**: Users can manually dismiss toasts through swipe or close button
**Toast Updates**: Update existing toast notifications with new content
**Toast Removal**: Programmatically remove toast notifications

## 🔗 **Integration Patterns**

### **Application Layout Integration**

The Toast component is integrated into the main application layout:

**Global Provider**: ToastProvider wraps the entire application in the main Layout component
**Fixed Positioning**: Toast notifications are positioned in the bottom-right corner
**Context Access**: All child components have access to toast functionality through React context
**State Persistence**: Toast notifications persist across component unmounts and route changes

**Related Documentation**: See [Layout.tsx](../../../apps/frontend/src/components/Layout.tsx) for integration details

### **Dice Box System Integration**

The Toast component integrates with the Dice Box system for automatic dice roll result display:

**Automatic Display**: Dice roll results are automatically displayed as toast notifications
**Formatted Content**: Dice roll toasts use rich formatted content for better display
**Consistent Styling**: Dice roll toasts use consistent styling with other notifications
**User Experience**: Provides immediate feedback for dice roll operations

**Related Documentation**: [Dice Box System Frontend Components](../dice-box-system/frontend-components.md)

### **Log Panel Integration**

The Toast component shares patterns and formatting with the log panel system:

**Consistent Styling**: Toast notifications use consistent styling with log entries
**Formatted Content**: Support for rich formatted content in toast notifications
**Type Consistency**: Toast types align with log entry types
**User Experience**: Provides immediate feedback that complements persistent log history

**Related Documentation**: [Log Panel Component](log-panel.md)

## 📊 **User Experience Patterns**

### **Toast Notification Interaction**

The Toast component provides intuitive user interaction patterns:

**Discovery**: Toast notifications appear automatically in response to user actions
**Dismissal**: Users can dismiss toasts through swipe gestures or close button
**Stacking**: Multiple toasts are stacked with proper visual hierarchy
**Accessibility**: Toast notifications are properly announced to screen readers
**Responsive Design**: Toast notifications adapt to different screen sizes

### **Toast Notification Display**

Toast notifications are displayed with clear and consistent formatting:

**Title Display**: Each toast shows a clear title for context
**Description Display**: Toast descriptions provide additional information
**Rich Content**: Support for complex formatted content including React elements
**Visual Hierarchy**: Clear visual hierarchy with proper typography and spacing
**Responsive Design**: Toast notifications adapt to different screen sizes and orientations

### **Performance Considerations**

The Toast component is optimized for performance and user experience:

**Toast Limits**: Configurable maximum number of toasts prevents UI clutter
**Automatic Cleanup**: Old toasts are automatically removed to prevent memory issues
**Efficient Rendering**: Optimized rendering for large numbers of toast notifications
**Smooth Animations**: Smooth animations for toast entrance, exit, and stacking

## 🔧 **Development Guidelines**

### **Adding Toast Notifications**

When adding toast notifications to components, follow these guidelines:

**Use Appropriate Types**: Choose the correct toast type (default, success, warning, error) for the message
**Provide Clear Messages**: Write clear, descriptive messages that help users understand the action
**Use Rich Content**: Include formatted content for complex notifications that require detailed display
**Consider User Impact**: Toast notifications should provide value to users, not just developers
**Respect Toast Limits**: Be mindful of toast frequency and impact on user experience

### **Integration Best Practices**

When integrating the Toast component with other systems:

**Consistent Formatting**: Use consistent formatting patterns across different toast sources
**Appropriate Notifications**: Show meaningful notifications that provide value to users
**Performance Awareness**: Be mindful of toast frequency and impact on performance
**User Experience**: Ensure toast notifications enhance rather than detract from user experience

### **Customization and Extension**

The Toast component is designed for customization and extension:

**Toast Limits**: Configure maximum number of concurrent toasts based on application needs
**Custom Styling**: Extend styling for custom toast types or special formatting
**Additional Features**: Add features like toast queuing, priority management, or custom animations
**Integration Points**: Extend integration with additional application systems

## 🔗 **Related Documentation**

- **[Frontend Component Architecture](frontend-components.md)** - Shared frontend component patterns
- **[Dice Box System Frontend Components](../dice-box-system/frontend-components.md)** - Dice Box system integration
- **[Log Panel Component](log-panel.md)** - Log panel system integration
- **[Layout Component](../../../apps/frontend/src/components/Layout.tsx)** - Application layout integration

## Summary

The Toast component provides a comprehensive global notification system that enhances the application's user feedback capabilities and user experience. It offers universal access for components to display notifications, intuitive user interface for viewing and dismissing notifications, and seamless integration with other application systems.

Key features include:
- **Global Access**: Any component can add toast notifications using the `useToast` hook
- **Intuitive Interface**: Fixed positioning with smooth animations and swipe dismissal
- **Type Support**: Multiple notification types with appropriate styling and behavior
- **System Integration**: Seamless integration with Dice Box, log panel, and layout systems
- **Performance Optimization**: Configurable toast limits with automatic cleanup
- **User Experience**: Immediate feedback that enhances rather than detracts from user experience
- **Developer Friendly**: Simple API for adding notifications with comprehensive type safety

The Toast component follows established React patterns while providing notification-specific functionality that enhances the overall application experience and user feedback capabilities.
