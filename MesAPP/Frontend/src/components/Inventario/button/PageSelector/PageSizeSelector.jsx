import React from 'react';
import { ChevronDown } from 'lucide-react';
import './PageSizeSelector.css';

const PageSizeSelector = ({ 
  value, 
  onChange, 
  options = [6, 8, 10, 12, 15] 
}) => {
  return (
    <div className="page-size-selector">
      <label className="selector-label">
        Elementos por página:
      </label>
      
      <div className="selector-wrapper">
        <select 
          className="selector-dropdown"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="selector-icon" />
      </div>
    </div>
  );
};

export default PageSizeSelector;