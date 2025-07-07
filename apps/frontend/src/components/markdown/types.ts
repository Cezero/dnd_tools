export interface MarkdownEditorProps {
    value?: string;
    onChange: (value?: string) => void;
    label?: string;
    className?: string;
    id?: string;
    name?: string;
    userVars?: Record<string, string | number>;
}

export interface ProcessMarkdownProps {
    markdown: string;
    id: string;
    userVars?: Record<string, string | number>;
} 