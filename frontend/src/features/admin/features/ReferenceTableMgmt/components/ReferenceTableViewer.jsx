import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getReferenceTableById } from '@/services/referenceTableService';

const ReferenceTableViewer = () => {
    const { id } = useParams();
    const [tableHtml, setTableHtml] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTable = async () => {
            try {
                const response = await getReferenceTableById(id);
                setTableHtml(response.html); // Assuming response.data contains the HTML string
            } catch (err) {
                setError('Failed to load reference table.');
                console.error(err);
            }
        };

        if (id) {
            fetchTable();
        }
    }, [id]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!tableHtml) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4">
            <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
        </div>
    );
};

export default ReferenceTableViewer;