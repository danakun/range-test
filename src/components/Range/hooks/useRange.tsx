// hooks/useRange.ts
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { RangeProps, RangeConfig, FixedValuesConfig } from '../Range.types';

type RangeState = {
  minValue: number;
  maxValue: number;
};

export function useRange({ mode, config }: RangeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
  const [editingLabel, setEditingLabel] = useState<'min' | 'max' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Initialize range values based on mode
  const [rangeValues, setRangeValues] = useState<RangeState>(() => {
    if (mode === 'normal') {
      const normalConfig = config as RangeConfig;
      return { minValue: normalConfig.min, maxValue: normalConfig.max };
    } else {
      const fixedConfig = config as FixedValuesConfig;
      if (fixedConfig.rangeValues.length === 0) {
        return { minValue: 0, maxValue: 0 };
      }
      return {
        minValue: fixedConfig.rangeValues[0],
        maxValue: fixedConfig.rangeValues[fixedConfig.rangeValues.length - 1]
      };
    }
  });

  const step = mode === 'normal' ? 1 : 1;

  // Debounced validation function
  const validateWithDelay = useCallback(
    (value: string, type: 'min' | 'max') => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const numValue = parseFloat(value);
        const normalConfig = config as RangeConfig;

        let error: string | null = null;

        if (isNaN(numValue)) {
          error = 'Please enter a valid number';
        } else if (numValue < normalConfig.min || numValue > normalConfig.max) {
          error = `Value must be between ${normalConfig.min} and ${normalConfig.max}`;
        } else if (type === 'min' && numValue >= rangeValues.maxValue) {
          error = `Minimum value must be less than ${rangeValues.maxValue}`;
        } else if (type === 'max' && numValue <= rangeValues.minValue) {
          error = `Maximum value must be greater than ${rangeValues.minValue}`;
        }

        setInputError(error);
      }, 500);
    },
    [config, rangeValues]
  );

  // Real-time validation as user types with debounce
  const handleTempValueChange = useCallback(
    (value: string) => {
      setTempValue(value);

      // Clear error immediately when user starts typing
      if (inputError) {
        setInputError(null);
      }

      // Start debounced validation
      if (editingLabel && value.trim() && mode === 'normal') {
        validateWithDelay(value, editingLabel);
      }
    },
    [inputError, editingLabel, mode, validateWithDelay]
  );

  // Calculation functions
  const calculateValueToPercentage = useCallback(
    (val: number) => {
      if (mode === 'normal') {
        const normalConfig = config as RangeConfig;
        const range = normalConfig.max - normalConfig.min;
        if (range === 0) return 0;
        return ((val - normalConfig.min) / range) * 100;
      }
      const fixedConfig = config as FixedValuesConfig;
      if (fixedConfig.rangeValues.length === 0) return 0;
      const i = fixedConfig.rangeValues.indexOf(val);
      if (i === -1) return 0;
      if (fixedConfig.rangeValues.length === 1) return 0;
      return (i / (fixedConfig.rangeValues.length - 1)) * 100;
    },
    [mode, config]
  );

  const calculatePixelToValue = useCallback(
    (x: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));

      if (mode === 'normal') {
        const normalConfig = config as RangeConfig;
        return normalConfig.min + pct * (normalConfig.max - normalConfig.min);
      } else {
        const fixedConfig = config as FixedValuesConfig;
        if (fixedConfig.rangeValues.length === 0) return 0;
        const idx = Math.round(pct * (fixedConfig.rangeValues.length - 1));
        return fixedConfig.rangeValues[idx] || 0;
      }
    },
    [mode, config]
  );

  const snapValueToStep = useCallback(
    (val: number) => {
      if (mode === 'normal') {
        return Math.round(val / step) * step;
      } else {
        const fixedConfig = config as FixedValuesConfig;
        if (fixedConfig.rangeValues.length === 0) return 0;
        return fixedConfig.rangeValues.reduce((prev: number, curr: number) =>
          Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
        );
      }
    },
    [mode, step, config]
  );

  // Memoized calculated values
  const minPercentage = useMemo(
    () => calculateValueToPercentage(rangeValues.minValue),
    [rangeValues.minValue, calculateValueToPercentage]
  );

  const maxPercentage = useMemo(
    () => calculateValueToPercentage(rangeValues.maxValue),
    [rangeValues.maxValue, calculateValueToPercentage]
  );

  const rangeWidth = useMemo(() => maxPercentage - minPercentage, [maxPercentage, minPercentage]);

  // Format values
  const formatValue = useCallback(
    (v: number) => (mode === 'fixed' ? `${v.toFixed(2)}€` : Math.round(v).toString()),
    [mode]
  );

  const formattedMinValue = useMemo(
    () => formatValue(rangeValues.minValue),
    [rangeValues.minValue, formatValue]
  );

  const formattedMaxValue = useMemo(
    () => formatValue(rangeValues.maxValue),
    [rangeValues.maxValue, formatValue]
  );

  // ARIA values
  const ariaMinValue = useMemo(() => {
    if (mode === 'normal') {
      const normalConfig = config as RangeConfig;
      return normalConfig.min;
    }
    const fixedConfig = config as FixedValuesConfig;
    return fixedConfig.rangeValues.length > 0 ? fixedConfig.rangeValues[0] : 0;
  }, [mode, config]);

  const ariaMaxValue = useMemo(() => {
    if (mode === 'normal') {
      const normalConfig = config as RangeConfig;
      return normalConfig.max;
    }
    const fixedConfig = config as FixedValuesConfig;
    return fixedConfig.rangeValues.length > 0
      ? fixedConfig.rangeValues[fixedConfig.rangeValues.length - 1]
      : 0;
  }, [mode, config]);

  // Event handlers
  const handleLabelEditStart = useCallback(
    (type: 'min' | 'max') => {
      if (mode === 'fixed') return;
      setEditingLabel(type);
      setTempValue(rangeValues[`${type}Value`].toString());
      setInputError(null);
    },
    [mode, rangeValues]
  );

  const handleLabelEditSubmit = useCallback(() => {
    if (!editingLabel || mode === 'fixed') return;

    // Inline validation to avoid scoping issues
    const numValue = parseFloat(tempValue);
    const normalConfig = config as RangeConfig;

    let error: string | null = null;

    // Check if it's a valid number
    if (isNaN(numValue)) {
      error = 'Please enter a valid number';
    }
    // Check if it's within the allowed range
    else if (numValue < normalConfig.min || numValue > normalConfig.max) {
      error = `Value must be between ${normalConfig.min} and ${normalConfig.max}`;
    }
    // Check if min/max constraint would be violated
    else if (editingLabel === 'min' && numValue >= rangeValues.maxValue) {
      error = `Minimum value must be less than ${rangeValues.maxValue}`;
    } else if (editingLabel === 'max' && numValue <= rangeValues.minValue) {
      error = `Maximum value must be greater than ${rangeValues.minValue}`;
    }

    if (error) {
      setInputError(error);
      return; // Don't submit if there's an error
    }

    const clampedValue = Math.max(normalConfig.min, Math.min(normalConfig.max, numValue));

    setRangeValues((prev: RangeState) => {
      if (editingLabel === 'min') {
        return { ...prev, minValue: Math.min(clampedValue, prev.maxValue - step) };
      } else {
        return { ...prev, maxValue: Math.max(clampedValue, prev.minValue + step) };
      }
    });

    setEditingLabel(null);
    setTempValue('');
    setInputError(null);
  }, [editingLabel, mode, tempValue, config, step, rangeValues]);

  const handleLabelKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLabelEditSubmit();
      } else if (e.key === 'Escape') {
        setEditingLabel(null);
        setTempValue('');
        setInputError(null);
      }
    },
    [handleLabelEditSubmit]
  );

  // Keyboard handlers for handles
  const createHandleKeydownHandler = useCallback(
    (handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.preventDefault();

      setRangeValues((prev: RangeState) => {
        if (mode === 'fixed') {
          const fixedConfig = config as FixedValuesConfig;
          if (fixedConfig.rangeValues.length === 0) return prev;

          const vals = fixedConfig.rangeValues;
          const currentVal = handle === 'min' ? prev.minValue : prev.maxValue;
          const currentIdx = vals.indexOf(currentVal);
          if (currentIdx === -1) return prev;

          let newIdx = currentIdx;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            newIdx = Math.max(0, currentIdx - 1);
          }
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            newIdx = Math.min(vals.length - 1, currentIdx + 1);
          }
          if (e.key === 'Home') newIdx = 0;
          if (e.key === 'End') newIdx = vals.length - 1;

          if (newIdx === currentIdx) return prev;
          const newVal = vals[newIdx];

          if (handle === 'min') {
            const maxIdx = vals.indexOf(prev.maxValue);
            if (newIdx <= maxIdx - 1) {
              return { ...prev, minValue: newVal };
            }
          } else {
            const minIdx = vals.indexOf(prev.minValue);
            if (newIdx >= minIdx + 1) {
              return { ...prev, maxValue: newVal };
            }
          }
          return prev;
        } else {
          const normalConfig = config as RangeConfig;
          let newVal = handle === 'min' ? prev.minValue : prev.maxValue;

          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newVal -= step;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newVal += step;
          if (e.key === 'Home') newVal = normalConfig.min;
          if (e.key === 'End') newVal = normalConfig.max;

          newVal = Math.max(normalConfig.min, Math.min(normalConfig.max, newVal));

          return handle === 'min'
            ? { ...prev, minValue: Math.min(newVal, prev.maxValue - step) }
            : { ...prev, maxValue: Math.max(newVal, prev.minValue + step) };
        }
      });
    },
    [mode, config, step]
  );

  // Mouse/touch drag handling
  useEffect(() => {
    const handleMove = (e: PointerEvent | TouchEvent) => {
      if (!activeHandle) return;

      let clientX: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const raw = calculatePixelToValue(clientX);
      const val = snapValueToStep(raw);

      setRangeValues((prev: RangeState) => {
        if (mode === 'fixed') {
          const fixedConfig = config as FixedValuesConfig;
          const vals = fixedConfig.rangeValues;
          if (vals.length === 0) return prev;

          const newValIdx = vals.indexOf(val);
          if (newValIdx === -1) return prev;

          if (activeHandle === 'min') {
            const maxIdx = vals.indexOf(prev.maxValue);
            if (newValIdx <= maxIdx - 1) {
              return { ...prev, minValue: vals[newValIdx] };
            }
          } else {
            const minIdx = vals.indexOf(prev.minValue);
            if (newValIdx >= minIdx + 1) {
              return { ...prev, maxValue: vals[newValIdx] };
            }
          }
          return prev;
        } else {
          if (activeHandle === 'min') {
            const maxAllowed = prev.maxValue - step;
            const clamped = Math.min(val, maxAllowed);
            return { ...prev, minValue: clamped };
          } else {
            const minAllowed = prev.minValue + step;
            const clamped = Math.max(val, minAllowed);
            return { ...prev, maxValue: clamped };
          }
        }
      });
    };

    const handleEnd = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      document.addEventListener('pointermove', handleMove as EventListener);
      document.addEventListener('touchmove', handleMove as EventListener);
      document.addEventListener('pointerup', handleEnd);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('pointercancel', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
      window.addEventListener('blur', handleEnd);
      document.addEventListener('visibilitychange', handleEnd);
    }

    return () => {
      document.removeEventListener('pointermove', handleMove as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('pointerup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('pointercancel', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
      window.removeEventListener('blur', handleEnd);
      document.removeEventListener('visibilitychange', handleEnd);
    };
  }, [activeHandle, step, mode, config, calculatePixelToValue, snapValueToStep]);

  // Input focus handling
  useEffect(() => {
    if (editingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLabel]);

  useEffect(() => {
    if (editingLabel) {
      setTempValue(rangeValues[`${editingLabel}Value`].toString());
    }
  }, [rangeValues, rangeValues.minValue, rangeValues.maxValue, editingLabel]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // Refs
    trackRef,
    inputRef,

    // State
    rangeValues,
    activeHandle,
    editingLabel,
    tempValue,

    // Calculated values
    minPercentage,
    maxPercentage,
    rangeWidth,
    formattedMinValue,
    formattedMaxValue,
    ariaMinValue,
    ariaMaxValue,

    // Event handlers
    handleLabelEditStart,
    handleLabelEditSubmit,
    handleLabelKeydown,
    createHandleKeydownHandler,

    // State setters
    setActiveHandle,
    setTempValue: handleTempValueChange,
    setEditingLabel,

    // Validation
    inputError,

    // Utilities
    formatValue
  };
}
