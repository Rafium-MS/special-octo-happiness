import { useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type CityChipsInputProps = {
  value: string[];
  onChange: (cities: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  error?: string;
};

const normalize = (value: string) => value.trim();

const CityChipsInput = ({ value, onChange, suggestions, placeholder, error }: CityChipsInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const listboxId = useId();

  const filteredSuggestions = useMemo(() => {
    if (!inputValue) {
      return suggestions.filter(
        (suggestion) => !value.some((city) => city.toLowerCase() === suggestion.toLowerCase())
      );
    }

    const search = inputValue.toLowerCase();
    return suggestions.filter((suggestion) => {
      const matches = suggestion.toLowerCase().includes(search);
      const alreadySelected = value.some((city) => city.toLowerCase() === suggestion.toLowerCase());
      return matches && !alreadySelected;
    });
  }, [inputValue, suggestions, value]);

  const handleAddCity = (city: string) => {
    const normalized = normalize(city);
    if (!normalized) return;

    const alreadySelected = value.some((existing) => existing.toLowerCase() === normalized.toLowerCase());
    if (alreadySelected) {
      setInputValue('');
      return;
    }

    onChange([...value, normalized]);
    setInputValue('');
  };

  const handleRemoveCity = (city: string) => {
    onChange(value.filter((existing) => existing !== city));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      handleAddCity(inputValue);
    }

    if (event.key === 'Backspace' && inputValue.length === 0 && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div
        className={`flex min-h-[46px] flex-wrap gap-2 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-green-500 ${
          error ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-300'
        }`}
      >
        {value.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
          >
            {city}
            <button
              type="button"
              onClick={() => handleRemoveCity(city)}
              className="rounded-full p-0.5 text-green-700 transition hover:bg-green-200"
              aria-label={`Remover cidade ${city}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[120px] border-none p-0 text-sm outline-none focus:outline-none"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={filteredSuggestions.length > 0}
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleAddCity(suggestion)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-green-50"
              role="option"
            >
              <span>{suggestion}</span>
              <span className="text-xs text-gray-400">Adicionar</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CityChipsInput;
