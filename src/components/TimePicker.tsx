import React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerProps {
  value: string; // Format "HH:MM"
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      className="w-[100px]"
    />
  );
};
