/**
 * Props for MainSidebar component
 */
export interface MainSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isHidden: boolean;
    setIsHidden: (hidden: boolean) => void;
}
