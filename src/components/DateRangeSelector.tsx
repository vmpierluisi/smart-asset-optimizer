
import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onChange({ ...value, start: date });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onChange({ ...value, end: date });
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Date Range
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <DatePicker
            selected={value.start}
            onChange={handleStartDateChange}
            className="input-field w-full"
            maxDate={value.end}
            placeholderText="Start Date"
          />
        </div>
        <div>
          <DatePicker
            selected={value.end}
            onChange={handleEndDateChange}
            className="input-field w-full"
            minDate={value.start}
            maxDate={new Date()}
            placeholderText="End Date"
          />
        </div>
      </div>
    </div>
  );
};
