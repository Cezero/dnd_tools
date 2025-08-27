import React from 'react';

import { ColorSwatch } from './ColorFormatters';

// Color formatter function for use in columns
export function formatColorWithSwatch(color: string): React.ReactElement {
    return <ColorSwatch color={ color }/>;
}
