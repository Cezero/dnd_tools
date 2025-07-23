import React from 'react';
import { Slider } from '@base-ui-components/react/slider';

interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
}

export function SliderControl({
    label,
    value,
    min,
    max,
    step = 0.1,
    onChange,
    className = ''
}: SliderControlProps): React.JSX.Element {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium">
                {label}
            </label>
            <div className="flex items-center space-x-4">
                <Slider.Root
                    value={[value]}
                    onValueChange={(values) => onChange(values[0])}
                    min={min}
                    max={max}
                    step={step}
                    className="flex-1"
                >
                    <Slider.Control className="relative w-full h-2 bg-secondary rounded-lg cursor-pointer">
                        <Slider.Track className="relative w-full h-full bg-secondary rounded-lg">
                            <Slider.Indicator className="absolute h-full bg-blue-500 rounded-lg" />
                            <Slider.Thumb className="block w-4 h-4 bg-blue-500 border-2 border-secondary rounded-full shadow-lg cursor-pointer hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" />
                        </Slider.Track>
                    </Slider.Control>
                </Slider.Root>
                <span className="text-sm font-mono w-12 text-secondary">
                    {value.toFixed(1)}
                </span>
            </div>
        </div>
    );
} 
