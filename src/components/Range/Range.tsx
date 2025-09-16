'use client';

import { useState, useRef, useEffect } from 'react';
import { RangeProps } from './Range.types';
import styles from './Range.module.css';

type RangeState = {
  minValue: number;
  maxValue: number;
};

export default function Range({ mode, config }: RangeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
  const [editingLabel, setEditingLabel] = useState<'min' | 'max' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const [rangeValues, setRangeValues] = useState<RangeState>(() => {
    if (mode === 'normal') {
      return { minValue: config.min, maxValue: config.max };
    } else {
      if (config.rangeValues.length === 0) {
        return { minValue: 0, maxValue: 0 };
      }
      return {
        minValue: config.rangeValues[0],
        maxValue: config.rangeValues[config.rangeValues.length - 1]
      };
    }
  });

  const step = mode === 'normal' ? 1 : 1;

  const calculateValueToPercentage = (val: number) => {
    if (mode === 'normal') {
      const range = config.max - config.min;
      if (range === 0) return 0;
      return ((val - config.min) / range) * 100;
    }

    if (config.rangeValues.length === 0) return 0;
    const i = config.rangeValues.indexOf(val);
    if (i === -1) return 0;
    if (config.rangeValues.length === 1) return 0;
    return (i / (config.rangeValues.length - 1)) * 100;
  };

  const calculatePixelToValue = (x: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));

    if (mode === 'normal') {
      return config.min + pct * (config.max - config.min);
    } else {
      if (config.rangeValues.length === 0) return 0;
      const idx = Math.round(pct * (config.rangeValues.length - 1));
      return config.rangeValues[idx] || 0;
    }
  };

  const snapValueToStep = (val: number) => {
    if (mode === 'normal') {
      return Math.round(val / step) * step;
    } else {
      if (config.rangeValues.length === 0) return 0;
      return config.rangeValues.reduce((prev, curr) =>
        Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
      );
    }
  };

  const handleLabelEditStart = (type: 'min' | 'max') => {
    if (mode === 'fixed') return;

    setEditingLabel(type);
    setTempValue(rangeValues[`${type}Value`].toString());
  };

  const handleLabelEditSubmit = () => {
    if (!editingLabel || mode === 'fixed') return;

    const newValue = parseFloat(tempValue);
    if (isNaN(newValue)) {
      setEditingLabel(null);
      setTempValue('');
      return;
    }

    const clampedValue = Math.max(config.min, Math.min(config.max, newValue));

    setRangeValues(prev => {
      if (editingLabel === 'min') {
        return { ...prev, minValue: Math.min(clampedValue, prev.maxValue - step) };
      } else {
        return { ...prev, maxValue: Math.max(clampedValue, prev.minValue + step) };
      }
    });

    setEditingLabel(null);
    setTempValue('');
  };

  const handleLabelKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingLabel(null);
      setTempValue('');
    }
  };

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
  }, [rangeValues.minValue, rangeValues.maxValue, editingLabel]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeHandle) return;
      const raw = calculatePixelToValue(e.clientX);
      const val = snapValueToStep(raw);

      setRangeValues(prev => {
        if (mode === 'fixed') {
          const vals = config.rangeValues;
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

    const handlePointerUp = () => setActiveHandle(null);

    if (activeHandle) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeHandle, step, mode, config]);

  const handleKeydown = (handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      return;
    }
    e.preventDefault();

    setRangeValues(prev => {
      if (mode === 'fixed') {
        if (config.rangeValues.length === 0) return prev;
        const vals = config.rangeValues;
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
        if (e.key === 'Home') {
          newIdx = 0;
        }
        if (e.key === 'End') {
          newIdx = vals.length - 1;
        }
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
        let newVal = handle === 'min' ? prev.minValue : prev.maxValue;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newVal -= step;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newVal += step;
        if (e.key === 'Home') newVal = config.min;
        if (e.key === 'End') newVal = config.max;
        newVal = Math.max(config.min, Math.min(config.max, newVal));
        return handle === 'min'
          ? { ...prev, minValue: Math.min(newVal, prev.maxValue - step) }
          : { ...prev, maxValue: Math.max(newVal, prev.minValue + step) };
      }
    });
  };

  const formatValue = (v: number) =>
    mode === 'fixed' ? `${v.toFixed(2)}€` : Math.round(v).toString();

  const getAriaMinValue = () => {
    if (mode === 'normal') return config.min;
    return config.rangeValues.length > 0 ? config.rangeValues[0] : 0;
  };

  const getAriaMaxValue = () => {
    if (mode === 'normal') return config.max;
    return config.rangeValues.length > 0 ? config.rangeValues[config.rangeValues.length - 1] : 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.rangeContainer}>
        <span
          className={`${styles.rangeLabel} ${editingLabel === 'min' ? styles.editing : ''} ${
            mode === 'normal' ? styles.clickable : ''
          }`}
          onClick={() => handleLabelEditStart('min')}
          role={mode === 'normal' ? 'button' : undefined}
          tabIndex={mode === 'normal' ? 0 : undefined}
          aria-label={
            mode === 'normal'
              ? `Click to edit minimum value: ${formatValue(rangeValues.minValue)}`
              : undefined
          }
          onKeyDown={
            mode === 'normal'
              ? e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLabelEditStart('min');
                  }
                }
              : undefined
          }
        >
          {editingLabel === 'min' ? (
            <input
              ref={inputRef}
              type='number'
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={handleLabelEditSubmit}
              onKeyDown={handleLabelKeydown}
              {...(mode === 'normal' ? { min: config.min, max: config.max } : {})}
              className={styles.labelInput}
            />
          ) : (
            formatValue(rangeValues.minValue)
          )}
        </span>

        <div ref={trackRef} className={styles.track}>
          <div
            className={styles.range}
            style={{
              left: `${calculateValueToPercentage(rangeValues.minValue)}%`,
              width: `${
                calculateValueToPercentage(rangeValues.maxValue) -
                calculateValueToPercentage(rangeValues.minValue)
              }%`
            }}
          />

          {(['min', 'max'] as const).map(h => (
            <button
              key={h}
              className={`${styles.handle} ${activeHandle === h ? styles.dragging : ''}`}
              style={{ left: `${calculateValueToPercentage(rangeValues[`${h}Value`])}%` }}
              onPointerDown={() => setActiveHandle(h)}
              onKeyDown={handleKeydown(h)}
              aria-label={`${h === 'min' ? 'Minimum' : 'Maximum'} value: ${formatValue(
                rangeValues[`${h}Value`]
              )}`}
              aria-orientation='horizontal'
              aria-valuemin={getAriaMinValue()}
              aria-valuemax={getAriaMaxValue()}
              aria-valuenow={rangeValues[`${h}Value`]}
              aria-valuetext={formatValue(rangeValues[`${h}Value`])}
              role='slider'
              tabIndex={0}
            />
          ))}
        </div>

        <span
          className={`${styles.rangeLabel} ${editingLabel === 'max' ? styles.editing : ''} ${
            mode === 'normal' ? styles.clickable : ''
          }`}
          onClick={() => handleLabelEditStart('max')}
          role={mode === 'normal' ? 'button' : undefined}
          tabIndex={mode === 'normal' ? 0 : undefined}
          aria-label={
            mode === 'normal'
              ? `Click to edit maximum value: ${formatValue(rangeValues.maxValue)}`
              : undefined
          }
          onKeyDown={
            mode === 'normal'
              ? e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLabelEditStart('max');
                  }
                }
              : undefined
          }
        >
          {editingLabel === 'max' ? (
            <input
              ref={editingLabel === 'max' ? inputRef : null}
              type='number'
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={handleLabelEditSubmit}
              onKeyDown={handleLabelKeydown}
              {...(mode === 'normal' ? { min: config.min, max: config.max } : {})}
              className={styles.labelInput}
            />
          ) : (
            formatValue(rangeValues.maxValue)
          )}
        </span>
      </div>
    </div>
  );
}
