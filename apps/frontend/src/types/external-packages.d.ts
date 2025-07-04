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

declare module 'pluralize' {
    function pluralize(word: string, count?: number, inclusive?: boolean): string;
    export = pluralize;
} 