// Type declarations for external packages

declare module '@mdi/react' {
    import { ComponentType } from 'react';

    interface IconProps {
        path: string;
        size?: number | string;
        color?: string;
        className?: string;
        title?: string;
    }

    const Icon: ComponentType<IconProps>;
    export default Icon;
}

declare module '@uiw/react-md-editor' {
    import { ComponentType } from 'react';

    interface MDEditorProps {
        value?: string;
        onChange?: (value?: string) => void;
        id?: string;
        name?: string;
        enableScroll?: boolean;
        className?: string;
        height?: string | number;
        preview?: 'live' | 'edit' | 'preview';
        components?: Record<string, ComponentType<any>>;
    }

    const MDEditor: ComponentType<MDEditorProps>;
    export default MDEditor;
}

declare module '@mdi/js' {
    export const mdiFilterOutline: string;
    export const mdiSortAscending: string;
    export const mdiSortDescending: string;
    export const mdiCog: string;
    export const mdiFilter: string;
    export const mdiPlaylistEdit: string;
    export const mdiTrashCan: string;
    export const mdiCloseCircleOutline: string;
    export const mdiSetAll: string;
    export const mdiSetNone: string;
    export const mdiAccount: string;
    export const mdiLogout: string;
    export const mdiLogin: string;
    export const mdiMenu: string;
    export const mdiClose: string;
    export const mdiPlus: string;
    export const mdiMinus: string;
    export const mdiCheck: string;
    export const mdiCloseCircle: string;
    export const mdiAlert: string;
    export const mdiInformation: string;
    export const mdiQuestion: string;
    export const mdiEye: string;
    export const mdiEyeOff: string;
    export const mdiMagnify: string;
    export const mdiRefresh: string;
    export const mdiDownload: string;
    export const mdiUpload: string;
    export const mdiDelete: string;
    export const mdiEdit: string;
    export const mdiSave: string;
    export const mdiCancel: string;
    export const mdiChevronDown: string;
    export const mdiChevronUp: string;
    export const mdiChevronLeft: string;
    export const mdiChevronRight: string;
    export const mdiArrowLeft: string;
    export const mdiArrowRight: string;
    export const mdiArrowUp: string;
    export const mdiArrowDown: string;
    export const mdiHome: string;
    export const mdiSettings: string;
    export const mdiUser: string;
    export const mdiUsers: string;
    export const mdiFile: string;
    export const mdiFolder: string;
    export const mdiLink: string;
    export const mdiStar: string;
    export const mdiHeart: string;
    export const mdiThumbUp: string;
    export const mdiThumbDown: string;
    export const mdiShare: string;
    export const mdiBookmark: string;
    export const mdiFlag: string;
    export const mdiBell: string;
    export const mdiEmail: string;
    export const mdiPhone: string;
    export const mdiMapMarker: string;
    export const mdiCalendar: string;
    export const mdiClock: string;
    export const mdiTimer: string;
    export const mdiStopwatch: string;
    export const mdiWeatherSunny: string;
    export const mdiWeatherNight: string;
    export const mdiWeatherCloudy: string;
    export const mdiWeatherRainy: string;
    export const mdiWeatherSnowy: string;
    export const mdiWeatherLightning: string;
    export const mdiWeatherWindy: string;
    export const mdiWeatherFog: string;
    export const mdiWeatherHail: string;
    export const mdiWeatherPartlyCloudy: string;
    export const mdiWeatherPouring: string;
    export const mdiWeatherSnowyHeavy: string;
    export const mdiWeatherTornado: string;
    export const mdiWeatherHurricane: string;
    export const mdiWeatherLightningRainy: string;
    export const mdiWeatherSnowyRainy: string;
    export const mdiWeatherHazy: string;
    export const mdiWeatherMist: string;
    export const mdiWeatherDust: string;
}

declare module '@headlessui/react' {
    import { ComponentType, ReactNode } from 'react';

    interface TransitionProps {
        show?: boolean;
        appear?: boolean;
        enter?: string;
        enterFrom?: string;
        enterTo?: string;
        entered?: string;
        leave?: string;
        leaveFrom?: string;
        leaveTo?: string;
        children: ReactNode | ((show: boolean) => ReactNode);
    }

    interface DialogProps {
        open: boolean;
        onClose: () => void;
        children: ReactNode;
    }

    interface DialogPanelProps {
        children: ReactNode;
        className?: string;
    }

    interface DialogTitleProps {
        children: ReactNode;
        className?: string;
    }

    interface DialogDescriptionProps {
        children: ReactNode;
        className?: string;
    }

    interface ListboxProps {
        value: any;
        onChange: (value: any) => void;
        children: ReactNode;
    }

    interface ListboxButtonProps {
        children: ReactNode;
        className?: string;
    }

    interface ListboxOptionsProps {
        children: ReactNode;
        className?: string;
    }

    interface ListboxOptionProps {
        value: any;
        children: ReactNode;
        className?: string;
    }

    interface ComboboxProps {
        value: any;
        onChange: (value: any) => void;
        children: ReactNode;
    }

    interface ComboboxInputProps {
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
        displayValue: (value: any) => string;
        className?: string;
    }

    interface ComboboxOptionsProps {
        children: ReactNode;
        className?: string;
    }

    interface ComboboxOptionProps {
        value: any;
        children: ReactNode;
        className?: string;
    }

    interface PopoverProps {
        children: ReactNode;
    }

    interface PopoverButtonProps {
        children: ReactNode;
        className?: string;
    }

    interface PopoverPanelProps {
        children: ReactNode;
        className?: string;
    }

    interface MenuProps {
        children: ReactNode;
    }

    interface MenuButtonProps {
        children: ReactNode;
        className?: string;
    }

    interface MenuItemsProps {
        children: ReactNode;
        className?: string;
    }

    interface MenuItemProps {
        children: ReactNode;
        className?: string;
        onClick?: () => void;
    }

    interface SwitchProps {
        checked: boolean;
        onChange: (checked: boolean) => void;
        children?: ReactNode;
        className?: string;
    }

    interface SwitchGroupProps {
        children: ReactNode;
    }

    interface SwitchLabelProps {
        children: ReactNode;
        className?: string;
    }

    interface SwitchDescriptionProps {
        children: ReactNode;
        className?: string;
    }

    interface RadioGroupProps {
        value: any;
        onChange: (value: any) => void;
        children: ReactNode;
    }

    interface RadioGroupLabelProps {
        children: ReactNode;
        className?: string;
    }

    interface RadioGroupDescriptionProps {
        children: ReactNode;
        className?: string;
    }

    interface RadioGroupOptionProps {
        value: any;
        children: ReactNode;
        className?: string;
    }

    interface TabProps {
        children: ReactNode;
    }

    interface TabListProps {
        children: ReactNode;
        className?: string;
    }

    interface TabProps {
        children: ReactNode;
        className?: string;
    }

    interface TabPanelsProps {
        children: ReactNode;
    }

    interface TabPanelProps {
        children: ReactNode;
        className?: string;
    }

    export const Transition: ComponentType<TransitionProps>;
    export const Dialog: ComponentType<DialogProps>;
    export const DialogPanel: ComponentType<DialogPanelProps>;
    export const DialogTitle: ComponentType<DialogTitleProps>;
    export const DialogDescription: ComponentType<DialogDescriptionProps>;
    export const Listbox: ComponentType<ListboxProps>;
    export const ListboxButton: ComponentType<ListboxButtonProps>;
    export const ListboxOptions: ComponentType<ListboxOptionsProps>;
    export const ListboxOption: ComponentType<ListboxOptionProps>;
    export const Combobox: ComponentType<ComboboxProps>;
    export const ComboboxInput: ComponentType<ComboboxInputProps>;
    export const ComboboxOptions: ComponentType<ComboboxOptionsProps>;
    export const ComboboxOption: ComponentType<ComboboxOptionProps>;
    export const Popover: ComponentType<PopoverProps>;
    export const PopoverButton: ComponentType<PopoverButtonProps>;
    export const PopoverPanel: ComponentType<PopoverPanelProps>;
    export const Menu: ComponentType<MenuProps>;
    export const MenuButton: ComponentType<MenuButtonProps>;
    export const MenuItems: ComponentType<MenuItemsProps>;
    export const MenuItem: ComponentType<MenuItemProps>;
    export const Switch: ComponentType<SwitchProps>;
    export const SwitchGroup: ComponentType<SwitchGroupProps>;
    export const SwitchLabel: ComponentType<SwitchLabelProps>;
    export const SwitchDescription: ComponentType<SwitchDescriptionProps>;
    export const RadioGroup: ComponentType<RadioGroupProps>;
    export const RadioGroupLabel: ComponentType<RadioGroupLabelProps>;
    export const RadioGroupDescription: ComponentType<RadioGroupDescriptionProps>;
    export const RadioGroupOption: ComponentType<RadioGroupOptionProps>;
    export const Tab: ComponentType<TabProps>;
    export const TabList: ComponentType<TabListProps>;
    export const TabPanels: ComponentType<TabPanelsProps>;
    export const TabPanel: ComponentType<TabPanelProps>;
}

declare module 'pluralize' {
    function pluralize(word: string, count?: number, inclusive?: boolean): string;
    export = pluralize;
} 