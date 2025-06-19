import { useParams } from 'react-router-dom';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';

const ReferenceTableViewer = () => {
    const { id } = useParams();


    return (
            <ProcessMarkdown markdown={`[Table: ${id}]`} />
    );
};

export default ReferenceTableViewer;