import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ label, name, value, onChange, options, placeholder, disabled, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-300">{label}</label>
            <div
                className={`glass-input w-full flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={value ? "text-white" : "text-white/50"}>
                    {value || placeholder || "Select Option"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                        style={{ backgroundColor: '#0f172a' }} // Fallback/Force dark background
                    >
                        {placeholder && (
                            <div
                                className="px-4 py-3 text-gray-400 hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => handleSelect("")}
                            >
                                {placeholder}
                            </div>
                        )}
                        {options.map((option) => (
                            <div
                                key={typeof option === 'string' ? option : option.value}
                                className={`px-4 py-3 text-white cursor-pointer transition-colors hover:bg-blood-red ${value === (typeof option === 'string' ? option : option.value) ? 'bg-blood-red/20' : ''}`}
                                onClick={() => handleSelect(typeof option === 'string' ? option : option.value)}
                            >
                                {typeof option === 'string' ? option : option.label || option}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden native select for form requirements if needed, though state is managed above */}
            <select name={name} value={value} required={required} className="sr-only" tabIndex={-1} onChange={() => { }}>
                <option value={value}>{value}</option>
            </select>
        </div>
    );
};

export default CustomSelect;
