import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ options, value, onChange, placeholder, label, disabled, renderOption, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`custom-select-container ${className || ''}`} ref={dropdownRef}>
            {label && <label className="input-label">{label}</label>}
            <div 
                className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="trigger-content">
                    {selectedOption ? (
                        <>
                            <span className="trigger-label">{selectedOption.label}</span>
                            {selectedOption.sub && <span className="trigger-sublabel">{selectedOption.sub}</span>}
                        </>
                    ) : (
                        <span style={{ color: '#94a3b8' }}>{placeholder || 'Select option'}</span>
                    )}
                </div>
                <svg className={`arrow-icon ${isOpen ? 'rotated' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            <div className={`custom-select-options ${isOpen ? 'show' : ''}`}>
                {options.length > 0 ? (
                    options.map((opt) => (
                        <div 
                            key={opt.value} 
                            className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {renderOption ? renderOption(opt) : (
                                <>
                                    <span className="option-title">{opt.label}</span>
                                    {opt.sub && <span className="option-subtitle">{opt.sub}</span>}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="custom-select-option" style={{ cursor: 'default', color: '#94a3b8' }}>
                        No options available
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
