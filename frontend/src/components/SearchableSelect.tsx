import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaSearch, FaTimes } from "react-icons/fa";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  label?: string;
  placeholder?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
};

function SearchableSelect({
  label,
  placeholder = "Search or select...",
  value,
  options,
  onChange,
  disabled = false,
  allowClear = true,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState(selectedOption?.label ?? "");

  useEffect(() => {
    setSearchText(selectedOption?.label ?? "");
  }, [selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchText(selectedOption?.label ?? "");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
      );
    });
  }, [options, searchText]);

  const handleSelect = (option: SearchableSelectOption) => {
    onChange(option.value);
    setSearchText(option.label);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchText("");
    setOpen(false);
  };

  return (
    <div className="searchable-select-wrapper" ref={wrapperRef}>
      {label && <label className="form-label">{label}</label>}

      <div
        className={`searchable-select ${
          open ? "open" : ""
        } ${disabled ? "disabled" : ""}`}
      >
        <FaSearch className="searchable-select-search-icon" size={13} />

        <input
          type="text"
          value={searchText}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearchText(event.target.value);
            setOpen(true);
          }}
        />

        {allowClear && value && !disabled && (
          <button
            type="button"
            className="searchable-select-clear"
            onClick={handleClear}
          >
            <FaTimes size={11} />
          </button>
        )}

        <button
          type="button"
          className="searchable-select-toggle"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <FaChevronDown size={12} />
        </button>
      </div>

      {open && !disabled && (
        <div className="searchable-select-menu">
          {filteredOptions.length === 0 ? (
            <div className="searchable-select-empty">No results found</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`searchable-select-option ${
                  option.value === value ? "selected" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                <span>{option.label}</span>

                {option.description && <small>{option.description}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;