"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { negociosApi, AddressSuggestion } from "@/lib/api/negocios";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  label = "Dirección",
  placeholder = "Ingresa una dirección...",
  required = false,
  error,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar direcciones con debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await negociosApi.searchAddresses(inputValue);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching addresses:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.display_name);
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Actualizar el valor final cuando el usuario sale del input
    onChange(inputValue);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      {label && (
        <Label htmlFor="direccion">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id="direccion"
          name="direccion"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={error ? "border-red-500" : ""}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors ${
                index === selectedIndex ? "bg-gray-100" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {suggestion.display_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lat: {suggestion.latitud.toFixed(6)}, Lng: {suggestion.longitud.toFixed(6)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {showSuggestions && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No se encontraron direcciones. Intenta con otra búsqueda.
          </p>
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-500">
        Empieza a escribir para ver sugerencias (mínimo 3 caracteres)
      </p>
    </div>
  );
}