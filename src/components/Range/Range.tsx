'use client';

import { RangeProps } from './Range.types';
import { useRange } from './hooks/useRange';
import styles from './Range.module.css';

export default function Range(props: RangeProps) {
  const {
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
    setTempValue,

    // Validation
    inputError
  } = useRange(props);

  // Debug: Let's see if inputError is actually being set
  console.log('inputError:', inputError, 'editingLabel:', editingLabel);

  const { mode, config } = props;

  return (
    <div className={styles.container}>
      {/* ARIA live region for value announcements */}
      <div aria-live='polite' aria-atomic='true' className={styles.srOnly}>
        {`Range: ${formattedMinValue} to ${formattedMaxValue}`}
      </div>

      <div className={styles.rangeContainer}>
        {/* Min Label */}
        <span
          className={`${styles.rangeLabel} ${editingLabel === 'min' ? styles.editing : ''} ${
            mode === 'normal' ? styles.clickable : ''
          } ${inputError && editingLabel === 'min' ? styles.error : ''}`} // ADD ERROR STYLING
          onClick={() => handleLabelEditStart('min')}
          role={mode === 'normal' ? 'button' : undefined}
          tabIndex={mode === 'normal' ? 0 : undefined}
          aria-label={
            mode === 'normal' ? `Click to edit minimum value: ${formattedMinValue}` : undefined
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
              name='range-min-value'
              id='range-min-input'
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={handleLabelEditSubmit}
              onKeyDown={handleLabelKeydown}
              {...(mode === 'normal'
                ? {
                    min: (config as any).min,
                    max: (config as any).max
                  }
                : {})}
              className={`${styles.labelInput} ${inputError ? styles.inputError : ''}`}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'input-error' : undefined}
              aria-label={`Edit minimum value, currently ${formattedMinValue}`}
            />
          ) : (
            formattedMinValue
          )}
        </span>

        {/* Track and Handles */}
        <div ref={trackRef} className={styles.track}>
          <div
            className={styles.range}
            style={{
              left: `${minPercentage}%`,
              width: `${rangeWidth}%`
            }}
          />

          {/* Min Handle */}
          <button
            className={`${styles.handle} ${activeHandle === 'min' ? styles.dragging : ''}`}
            style={{ left: `${minPercentage}%` }}
            onPointerDown={() => setActiveHandle('min')}
            onKeyDown={createHandleKeydownHandler('min')}
            aria-label={`Minimum value: ${formattedMinValue}`}
            aria-orientation='horizontal'
            aria-valuemin={ariaMinValue}
            aria-valuemax={ariaMaxValue}
            aria-valuenow={rangeValues.minValue}
            aria-valuetext={formattedMinValue}
            role='slider'
            tabIndex={0}
          />

          {/* Max Handle */}
          <button
            className={`${styles.handle} ${activeHandle === 'max' ? styles.dragging : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onPointerDown={() => setActiveHandle('max')}
            onKeyDown={createHandleKeydownHandler('max')}
            aria-label={`Maximum value: ${formattedMaxValue}`}
            aria-orientation='horizontal'
            aria-valuemin={ariaMinValue}
            aria-valuemax={ariaMaxValue}
            aria-valuenow={rangeValues.maxValue}
            aria-valuetext={formattedMaxValue}
            role='slider'
            tabIndex={0}
          />
        </div>

        {/* Max Label */}
        <span
          className={`${styles.rangeLabel} ${editingLabel === 'max' ? styles.editing : ''} ${
            mode === 'normal' ? styles.clickable : ''
          } ${inputError && editingLabel === 'max' ? styles.error : ''}`} // ADD ERROR STYLING
          onClick={() => handleLabelEditStart('max')}
          role={mode === 'normal' ? 'button' : undefined}
          tabIndex={mode === 'normal' ? 0 : undefined}
          aria-label={
            mode === 'normal' ? `Click to edit maximum value: ${formattedMaxValue}` : undefined
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
              name='range-max-value'
              id='range-max-input'
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={handleLabelEditSubmit}
              onKeyDown={handleLabelKeydown}
              {...(mode === 'normal'
                ? {
                    min: (config as any).min,
                    max: (config as any).max
                  }
                : {})}
              className={`${styles.labelInput} ${inputError ? styles.inputError : ''}`}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'input-error' : undefined}
              aria-label={`Edit maximum value, currently ${formattedMaxValue}`}
            />
          ) : (
            formattedMaxValue
          )}
        </span>
      </div>

      {inputError && editingLabel && (
        <div className={styles.errorMessage} role='alert' aria-live='polite' id='input-error'>
          <strong>Error:</strong> {inputError}
        </div>
      )}
    </div>
  );
}
// 'use client';

// import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import { FixedValuesConfig, RangeConfig, RangeProps } from './Range.types';
// import styles from './Range.module.css';

// type RangeState = {
//   minValue: number;
//   maxValue: number;
// };

// export default function Range({ mode, config }: RangeProps) {
//   const trackRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);
//   const [editingLabel, setEditingLabel] = useState<'min' | 'max' | null>(null);
//   const [tempValue, setTempValue] = useState('');

//   const [rangeValues, setRangeValues] = useState<RangeState>(() => {
//     if (mode === 'normal') {
//       return { minValue: config.min, maxValue: config.max };
//     } else {
//       if (config.rangeValues.length === 0) {
//         return { minValue: 0, maxValue: 0 };
//       }
//       return {
//         minValue: config.rangeValues[0],
//         maxValue: config.rangeValues[config.rangeValues.length - 1]
//       };
//     }
//   });

//   const step = mode === 'normal' ? 1 : 1;

//   // Memoize the calculations
//   const calculateValueToPercentage = useCallback(
//     (val: number) => {
//       if (mode === 'normal') {
//         const normalConfig = config as RangeConfig;
//         const range = normalConfig.max - normalConfig.min;
//         if (range === 0) return 0;
//         return ((val - normalConfig.min) / range) * 100;
//       }
//       const fixedConfig = config as FixedValuesConfig;
//       if (fixedConfig.rangeValues.length === 0) return 0;
//       const i = fixedConfig.rangeValues.indexOf(val);
//       if (i === -1) return 0;
//       if (fixedConfig.rangeValues.length === 1) return 0;
//       return (i / (fixedConfig.rangeValues.length - 1)) * 100;
//     },
//     [mode, config]
//   );

//   const calculatePixelToValue = useCallback(
//     (x: number) => {
//       if (!trackRef.current) return 0;
//       const rect = trackRef.current.getBoundingClientRect();
//       const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));

//       if (mode === 'normal') {
//         const normalConfig = config as RangeConfig;
//         return normalConfig.min + pct * (normalConfig.max - normalConfig.min);
//       } else {
//         const fixedConfig = config as FixedValuesConfig;
//         if (fixedConfig.rangeValues.length === 0) return 0;
//         const idx = Math.round(pct * (fixedConfig.rangeValues.length - 1));
//         return fixedConfig.rangeValues[idx] || 0;
//       }
//     },
//     [mode, config]
//   );

//   const snapValueToStep = useCallback(
//     (val: number) => {
//       if (mode === 'normal') {
//         return Math.round(val / step) * step;
//       } else {
//         const fixedConfig = config as FixedValuesConfig;
//         if (fixedConfig.rangeValues.length === 0) return 0;
//         return fixedConfig.rangeValues.reduce((prev, curr) =>
//           Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
//         );
//       }
//     },
//     [mode, step, config]
//   );

//   // Memoize percentage calculations for positioning
//   const minPercentage = useMemo(
//     () => calculateValueToPercentage(rangeValues.minValue),
//     [rangeValues.minValue, calculateValueToPercentage]
//   );

//   const maxPercentage = useMemo(
//     () => calculateValueToPercentage(rangeValues.maxValue),
//     [rangeValues.maxValue, calculateValueToPercentage]
//   );

//   // Memoize the range zone calculation
//   const rangeWidth = useMemo(() => maxPercentage - minPercentage, [maxPercentage, minPercentage]);

//   // Memoize formatted values
//   const formattedMinValue = useMemo(
//     () =>
//       mode === 'fixed'
//         ? `${rangeValues.minValue.toFixed(2)}€`
//         : Math.round(rangeValues.minValue).toString(),
//     [mode, rangeValues.minValue]
//   );

//   const formattedMaxValue = useMemo(
//     () =>
//       mode === 'fixed'
//         ? `${rangeValues.maxValue.toFixed(2)}€`
//         : Math.round(rangeValues.maxValue).toString(),
//     [mode, rangeValues.maxValue]
//   );

//   // Memoize ARIA values
//   const ariaMinValue = useMemo(() => {
//     if (mode === 'normal') {
//       // TypeScript now knows config has min/max properties
//       return (config as RangeConfig).min;
//     } else {
//       // mode === 'fixed', so config has rangeValues
//       const fixedConfig = config as FixedValuesConfig;
//       return fixedConfig.rangeValues.length > 0 ? fixedConfig.rangeValues[0] : 0;
//     }
//   }, [mode, config]);

//   const ariaMaxValue = useMemo(() => {
//     if (mode === 'normal') {
//       return (config as RangeConfig).max;
//     } else {
//       const fixedConfig = config as FixedValuesConfig;
//       return fixedConfig.rangeValues.length > 0
//         ? fixedConfig.rangeValues[fixedConfig.rangeValues.length - 1]
//         : 0;
//     }
//   }, [mode, config]);

//   // Memoize event handlers
//   const handleLabelEditStart = useCallback(
//     (type: 'min' | 'max') => {
//       if (mode === 'fixed') return;
//       setEditingLabel(type);
//       setTempValue(rangeValues[`${type}Value`].toString());
//     },
//     [mode, rangeValues]
//   );

//   const handleLabelEditSubmit = useCallback(() => {
//     if (!editingLabel || mode === 'fixed') return;

//     const newValue = parseFloat(tempValue);
//     if (isNaN(newValue)) {
//       setEditingLabel(null);
//       setTempValue('');
//       return;
//     }

//     const clampedValue = Math.max(config.min, Math.min(config.max, newValue));

//     setRangeValues(prev => {
//       if (editingLabel === 'min') {
//         return { ...prev, minValue: Math.min(clampedValue, prev.maxValue - step) };
//       } else {
//         return { ...prev, maxValue: Math.max(clampedValue, prev.minValue + step) };
//       }
//     });

//     setEditingLabel(null);
//     setTempValue('');
//   }, [editingLabel, mode, tempValue, config, step]);

//   const handleLabelKeydown = useCallback(
//     (e: React.KeyboardEvent) => {
//       if (e.key === 'Enter') {
//         e.preventDefault();
//         handleLabelEditSubmit();
//       } else if (e.key === 'Escape') {
//         setEditingLabel(null);
//         setTempValue('');
//       }
//     },
//     [handleLabelEditSubmit]
//   );

//   // Memoize keyboard handlers for each handle
//   const handleMinKeydown = useCallback(
//     (e: React.KeyboardEvent) => {
//       if (e.key === 'Tab') return;
//       e.preventDefault();

//       setRangeValues(prev => {
//         if (mode === 'fixed') {
//           if (config.rangeValues.length === 0) return prev;
//           const vals = config.rangeValues;
//           const currentIdx = vals.indexOf(prev.minValue);
//           if (currentIdx === -1) return prev;

//           let newIdx = currentIdx;
//           if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
//             newIdx = Math.max(0, currentIdx - 1);
//           }
//           if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
//             newIdx = Math.min(vals.length - 1, currentIdx + 1);
//           }
//           if (e.key === 'Home') newIdx = 0;
//           if (e.key === 'End') newIdx = vals.length - 1;

//           if (newIdx === currentIdx) return prev;
//           const maxIdx = vals.indexOf(prev.maxValue);
//           if (newIdx <= maxIdx - 1) {
//             return { ...prev, minValue: vals[newIdx] };
//           }
//           return prev;
//         } else {
//           let newVal = prev.minValue;
//           if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newVal -= step;
//           if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newVal += step;
//           if (e.key === 'Home') newVal = config.min;
//           if (e.key === 'End') newVal = config.max;
//           newVal = Math.max(config.min, Math.min(config.max, newVal));
//           return { ...prev, minValue: Math.min(newVal, prev.maxValue - step) };
//         }
//       });
//     },
//     [mode, config, step]
//   );

//   const handleMaxKeydown = useCallback(
//     (e: React.KeyboardEvent) => {
//       if (e.key === 'Tab') return;
//       e.preventDefault();

//       setRangeValues(prev => {
//         if (mode === 'fixed') {
//           if (config.rangeValues.length === 0) return prev;
//           const vals = config.rangeValues;
//           const currentIdx = vals.indexOf(prev.maxValue);
//           if (currentIdx === -1) return prev;

//           let newIdx = currentIdx;
//           if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
//             newIdx = Math.max(0, currentIdx - 1);
//           }
//           if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
//             newIdx = Math.min(vals.length - 1, currentIdx + 1);
//           }
//           if (e.key === 'Home') newIdx = 0;
//           if (e.key === 'End') newIdx = vals.length - 1;

//           if (newIdx === currentIdx) return prev;
//           const minIdx = vals.indexOf(prev.minValue);
//           if (newIdx >= minIdx + 1) {
//             return { ...prev, maxValue: vals[newIdx] };
//           }
//           return prev;
//         } else {
//           let newVal = prev.maxValue;
//           if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') newVal -= step;
//           if (e.key === 'ArrowRight' || e.key === 'ArrowUp') newVal += step;
//           if (e.key === 'Home') newVal = config.min;
//           if (e.key === 'End') newVal = config.max;
//           newVal = Math.max(config.min, Math.min(config.max, newVal));
//           return { ...prev, maxValue: Math.max(newVal, prev.minValue + step) };
//         }
//       });
//     },
//     [mode, config, step]
//   );

//   useEffect(() => {
//     if (editingLabel && inputRef.current) {
//       inputRef.current.focus();
//       inputRef.current.select();
//     }
//   }, [editingLabel]);

//   useEffect(() => {
//     if (editingLabel) {
//       setTempValue(rangeValues[`${editingLabel}Value`].toString());
//     }
//   }, [rangeValues, rangeValues.minValue, rangeValues.maxValue, editingLabel]);

//   useEffect(() => {
//     const handleMove = (e: PointerEvent | TouchEvent) => {
//       if (!activeHandle) return;

//       let clientX: number;
//       if ('touches' in e) {
//         if (e.touches.length === 0) return;
//         clientX = e.touches[0].clientX;
//       } else {
//         clientX = e.clientX;
//       }

//       const raw = calculatePixelToValue(clientX);
//       const val = snapValueToStep(raw);

//       setRangeValues(prev => {
//         if (mode === 'fixed') {
//           const vals = config.rangeValues;
//           if (vals.length === 0) return prev;

//           const newValIdx = vals.indexOf(val);
//           if (newValIdx === -1) return prev;

//           if (activeHandle === 'min') {
//             const maxIdx = vals.indexOf(prev.maxValue);
//             if (newValIdx <= maxIdx - 1) {
//               return { ...prev, minValue: vals[newValIdx] };
//             }
//           } else {
//             const minIdx = vals.indexOf(prev.minValue);
//             if (newValIdx >= minIdx + 1) {
//               return { ...prev, maxValue: vals[newValIdx] };
//             }
//           }
//           return prev;
//         } else {
//           if (activeHandle === 'min') {
//             const maxAllowed = prev.maxValue - step;
//             const clamped = Math.min(val, maxAllowed);
//             return { ...prev, minValue: clamped };
//           } else {
//             const minAllowed = prev.minValue + step;
//             const clamped = Math.max(val, minAllowed);
//             return { ...prev, maxValue: clamped };
//           }
//         }
//       });
//     };

//     const handleEnd = () => {
//       setActiveHandle(null);
//     };

//     if (activeHandle) {
//       document.addEventListener('pointermove', handleMove as EventListener);
//       document.addEventListener('touchmove', handleMove as EventListener);

//       document.addEventListener('pointerup', handleEnd);
//       document.addEventListener('touchend', handleEnd);
//       document.addEventListener('pointercancel', handleEnd);
//       document.addEventListener('touchcancel', handleEnd);

//       window.addEventListener('blur', handleEnd);
//       document.addEventListener('visibilitychange', handleEnd);
//     }

//     return () => {
//       document.removeEventListener('pointermove', handleMove as EventListener);
//       document.removeEventListener('touchmove', handleMove as EventListener);
//       document.removeEventListener('pointerup', handleEnd);
//       document.removeEventListener('touchend', handleEnd);
//       document.removeEventListener('pointercancel', handleEnd);
//       document.removeEventListener('touchcancel', handleEnd);
//       window.removeEventListener('blur', handleEnd);
//       document.removeEventListener('visibilitychange', handleEnd);
//     };
//   }, [activeHandle, step, mode, config, calculatePixelToValue, snapValueToStep]);

//   return (
//     <div className={styles.container}>
//       <div className={styles.rangeContainer}>
//         <span
//           className={`${styles.rangeLabel} ${editingLabel === 'min' ? styles.editing : ''} ${
//             mode === 'normal' ? styles.clickable : ''
//           }`}
//           onClick={() => handleLabelEditStart('min')}
//           role={mode === 'normal' ? 'button' : undefined}
//           tabIndex={mode === 'normal' ? 0 : undefined}
//           aria-label={
//             mode === 'normal' ? `Click to edit minimum value: ${formattedMinValue}` : undefined
//           }
//           onKeyDown={
//             mode === 'normal'
//               ? e => {
//                   if (e.key === 'Enter' || e.key === ' ') {
//                     e.preventDefault();
//                     handleLabelEditStart('min');
//                   }
//                 }
//               : undefined
//           }
//         >
//           {editingLabel === 'min' ? (
//             <input
//               ref={inputRef}
//               type='number'
//               value={tempValue}
//               onChange={e => setTempValue(e.target.value)}
//               onBlur={handleLabelEditSubmit}
//               onKeyDown={handleLabelKeydown}
//               {...(mode === 'normal' ? { min: config.min, max: config.max } : {})}
//               className={styles.labelInput}
//             />
//           ) : (
//             formattedMinValue
//           )}
//         </span>

//         <div ref={trackRef} className={styles.track}>
//           <div
//             className={styles.range}
//             style={{
//               left: `${minPercentage}%`,
//               width: `${rangeWidth}%`
//             }}
//           />

//           <button
//             className={`${styles.handle} ${activeHandle === 'min' ? styles.dragging : ''}`}
//             style={{ left: `${minPercentage}%` }}
//             onPointerDown={() => setActiveHandle('min')}
//             onKeyDown={handleMinKeydown}
//             aria-label={`Minimum value: ${formattedMinValue}`}
//             aria-orientation='horizontal'
//             aria-valuemin={ariaMinValue}
//             aria-valuemax={ariaMaxValue}
//             aria-valuenow={rangeValues.minValue}
//             aria-valuetext={formattedMinValue}
//             role='slider'
//             tabIndex={0}
//           />

//           <button
//             className={`${styles.handle} ${activeHandle === 'max' ? styles.dragging : ''}`}
//             style={{ left: `${maxPercentage}%` }}
//             onPointerDown={() => setActiveHandle('max')}
//             onKeyDown={handleMaxKeydown}
//             aria-label={`Maximum value: ${formattedMaxValue}`}
//             aria-orientation='horizontal'
//             aria-valuemin={ariaMinValue}
//             aria-valuemax={ariaMaxValue}
//             aria-valuenow={rangeValues.maxValue}
//             aria-valuetext={formattedMaxValue}
//             role='slider'
//             tabIndex={0}
//           />
//         </div>

//         <span
//           className={`${styles.rangeLabel} ${editingLabel === 'max' ? styles.editing : ''} ${
//             mode === 'normal' ? styles.clickable : ''
//           }`}
//           onClick={() => handleLabelEditStart('max')}
//           role={mode === 'normal' ? 'button' : undefined}
//           tabIndex={mode === 'normal' ? 0 : undefined}
//           aria-label={
//             mode === 'normal' ? `Click to edit maximum value: ${formattedMaxValue}` : undefined
//           }
//           onKeyDown={
//             mode === 'normal'
//               ? e => {
//                   if (e.key === 'Enter' || e.key === ' ') {
//                     e.preventDefault();
//                     handleLabelEditStart('max');
//                   }
//                 }
//               : undefined
//           }
//         >
//           {editingLabel === 'max' ? (
//             <input
//               ref={editingLabel === 'max' ? inputRef : null}
//               type='number'
//               value={tempValue}
//               onChange={e => setTempValue(e.target.value)}
//               onBlur={handleLabelEditSubmit}
//               onKeyDown={handleLabelKeydown}
//               {...(mode === 'normal' ? { min: config.min, max: config.max } : {})}
//               className={styles.labelInput}
//             />
//           ) : (
//             formattedMaxValue
//           )}
//         </span>
//       </div>
//     </div>
//   );
// }
