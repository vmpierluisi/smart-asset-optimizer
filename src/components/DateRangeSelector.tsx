
import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeSelectorProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Date Range
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <DatePicker
            selected={value.start}
            onChange={(date) => date && onChange({ ...value, start: date })}
            className="input-field w-full"
            maxDate={value.end}
            placeholderText="Start Date"
          />
        </div>
        <div>
          <DatePicker
            selected={value.end}
            onChange={(date) => date && onChange({ ...value, end: date })}
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
