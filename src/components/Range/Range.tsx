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
  const [activeHandle, setActiveHandle] = useState<'min' | 'max' | null>(null);

  // --- initial state with edge case handling
  const [state, setState] = useState<RangeState>(() => {
    if (mode === 'normal') {
      return { minValue: config.min, maxValue: config.max };
    } else {
      // Handle empty arrays gracefully
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

  // --- helpers with edge case handling
  const valueToPct = (val: number) => {
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

  const pixelToValue = (x: number) => {
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

  const snapValue = (val: number) => {
    if (mode === 'normal') {
      return Math.round(val / step) * step;
    }
    return val;
  };

  // --- dragging with improved handling
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!activeHandle) return;
      const raw = pixelToValue(e.clientX);
      const val = snapValue(raw);

      setState(prev => {
        if (activeHandle === 'min') {
          const maxAllowed =
            mode === 'fixed' && config.rangeValues.length > 0
              ? prev.maxValue
              : prev.maxValue - step;
          const clamped = Math.min(val, maxAllowed);
          return { ...prev, minValue: clamped };
        } else {
          const minAllowed =
            mode === 'fixed' && config.rangeValues.length > 0
              ? prev.minValue
              : prev.minValue + step;
          const clamped = Math.max(val, minAllowed);
          return { ...prev, maxValue: clamped };
        }
      });
    };

    const up = () => setActiveHandle(null);

    if (activeHandle) {
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    }
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
  }, [activeHandle, step, mode, config]);

  // --- Fixed keyboard navigation
  const onKey = (handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
    // Don't prevent default for Tab key - allow normal focus flow
    if (e.key === 'Tab') {
      return; // Let browser handle tab navigation
    }

    e.preventDefault(); // Only prevent default for other keys

    setState(prev => {
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

        // Prevent handles from crossing in fixed mode
        if (handle === 'min') {
          const maxIdx = vals.indexOf(prev.maxValue);
          if (newIdx < maxIdx) {
            return { ...prev, minValue: newVal };
          }
        } else {
          const minIdx = vals.indexOf(prev.minValue);
          if (newIdx > minIdx) {
            return { ...prev, maxValue: newVal };
          }
        }

        return prev;
      } else {
        // Normal mode
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

  const format = (v: number) => (mode === 'fixed' ? `${v.toFixed(2)}€` : Math.round(v).toString());

  // Safe ARIA value getters
  const getAriaValueMin = () => {
    if (mode === 'normal') return config.min;
    return config.rangeValues.length > 0 ? config.rangeValues[0] : 0;
  };

  const getAriaValueMax = () => {
    if (mode === 'normal') return config.max;
    return config.rangeValues.length > 0 ? config.rangeValues[config.rangeValues.length - 1] : 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.rangeContainer}>
        <span className={styles.rangeLabel}>{format(state.minValue)}</span>

        <div ref={trackRef} className={styles.track}>
          <div
            className={styles.range}
            style={{
              left: `${valueToPct(state.minValue)}%`,
              width: `${valueToPct(state.maxValue) - valueToPct(state.minValue)}%`
            }}
          />

          {(['min', 'max'] as const).map(h => (
            <button
              key={h}
              className={`${styles.handle} ${activeHandle === h ? styles.dragging : ''}`}
              style={{ left: `${valueToPct(state[`${h}Value`])}%` }}
              onPointerDown={() => setActiveHandle(h)}
              onKeyDown={onKey(h)}
              aria-label={`${h === 'min' ? 'Minimum' : 'Maximum'} value: ${format(
                state[`${h}Value`]
              )}`}
              aria-orientation='horizontal'
              aria-valuemin={getAriaValueMin()}
              aria-valuemax={getAriaValueMax()}
              aria-valuenow={state[`${h}Value`]}
              aria-valuetext={format(state[`${h}Value`])}
              role='slider'
              tabIndex={0}
            />
          ))}
        </div>

        <span className={styles.rangeLabel}>{format(state.maxValue)}</span>
      </div>
    </div>
  );
}
// 'use client';

// import { useState, useRef, useCallback, useEffect } from 'react';
// import { RangeProps } from './Range.types';
// import styles from './Range.module.css';

// export default function Range(props: RangeProps) {
//   const trackRef = useRef<HTMLDivElement>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragHandle, setDragHandle] = useState<'min' | 'max' | null>(null);

//   // Initialize values based on mode
//   const getInitialValues = useCallback(() => {
//     if (props.mode === 'normal') {
//       const { min, max } = props.config;
//       return {
//         minValue: min,
//         maxValue: max,
//         minIndex: 0,
//         maxIndex: 0
//       };
//     } else {
//       const values = props.config.rangeValues;
//       if (values.length === 0) {
//         return {
//           minValue: 0,
//           maxValue: 0,
//           minIndex: 0,
//           maxIndex: 0
//         };
//       }
//       return {
//         minValue: values[0],
//         maxValue: values[values.length - 1],
//         minIndex: 0,
//         maxIndex: values.length - 1
//       };
//     }
//   }, [props]);

//   const [state, setState] = useState(() => getInitialValues());

//   // Convert pixel position to value
//   const pixelToValue = useCallback(
//     (clientX: number) => {
//       if (!trackRef.current) return 0;

//       const rect = trackRef.current.getBoundingClientRect();
//       const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         return min + percentage * (max - min);
//       } else {
//         const values = props.config.rangeValues;
//         if (values.length === 0) return 0;
//         const index = Math.round(percentage * (values.length - 1));
//         return values[index] || 0;
//       }
//     },
//     [props]
//   );

//   // Convert value to pixel percentage
//   const valueToPercentage = useCallback(
//     (value: number) => {
//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         return ((value - min) / (max - min)) * 100;
//       } else {
//         const values = props.config.rangeValues;
//         if (values.length === 0) return 0;
//         const index = values.indexOf(value);
//         return (index / (values.length - 1)) * 100;
//       }
//     },
//     [props]
//   );

//   // Handle mouse/touch events
//   const handlePointerDown = useCallback(
//     (handle: 'min' | 'max') => (e: React.PointerEvent) => {
//       e.preventDefault();
//       setIsDragging(true);
//       setDragHandle(handle);

//       // Only use pointer capture if available (not in test environment)
//       const target = e.currentTarget as HTMLElement;
//       if (target.setPointerCapture) {
//         target.setPointerCapture(e.pointerId);
//       }
//     },
//     []
//   );

//   const handlePointerMove = useCallback(
//     (e: React.PointerEvent) => {
//       if (!isDragging || !dragHandle) return;

//       const newValue = pixelToValue(e.clientX);
//       if (typeof newValue !== 'number') return;

//       setState(prev => {
//         let newState = { ...prev };

//         if (props.mode === 'fixed') {
//           const values = props.config.rangeValues;
//           if (values.length === 0) return prev;

//           const newIndex = values.indexOf(newValue);
//           if (newIndex === -1) return prev;

//           if (dragHandle === 'min') {
//             if (newIndex <= newState.maxIndex) {
//               newState.minValue = newValue;
//               newState.minIndex = newIndex;
//             }
//           } else {
//             if (newIndex >= newState.minIndex) {
//               newState.maxValue = newValue;
//               newState.maxIndex = newIndex;
//             }
//           }
//         } else {
//           if (dragHandle === 'min') {
//             if (newValue <= newState.maxValue) {
//               newState.minValue = newValue;
//             }
//           } else {
//             if (newValue >= newState.minValue) {
//               newState.maxValue = newValue;
//             }
//           }
//         }

//         return newState;
//       });
//     },
//     [isDragging, dragHandle, pixelToValue, props]
//   );

//   const handlePointerUp = useCallback((e: React.PointerEvent) => {
//     setIsDragging(false);
//     setDragHandle(null);

//     // Only use pointer capture if available (not in test environment)
//     const target = e.currentTarget as HTMLElement;
//     if (target.releasePointerCapture) {
//       target.releasePointerCapture(e.pointerId);
//     }
//   }, []);

//   // Keyboard navigation
//   const handleKeyDown = useCallback(
//     (handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
//       let step = 1;

//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         step = (max - min) / 100; // 1% steps
//       }

//       setState(prev => {
//         let newState = { ...prev };

//         if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
//           e.preventDefault();
//           if (props.mode === 'fixed') {
//             const values = props.config.rangeValues;
//             if (values.length === 0) return prev;

//             if (handle === 'min' && prev.minIndex > 0) {
//               const newIndex = prev.minIndex - 1;
//               newState.minIndex = newIndex;
//               newState.minValue = values[newIndex];
//             } else if (handle === 'max' && prev.maxIndex > prev.minIndex) {
//               const newIndex = prev.maxIndex - 1;
//               newState.maxIndex = newIndex;
//               newState.maxValue = values[newIndex];
//             }
//           } else {
//             if (handle === 'min') {
//               const newValue = Math.max(props.config.min, prev.minValue - step);
//               if (newValue <= prev.maxValue) newState.minValue = newValue;
//             } else {
//               const newValue = Math.max(prev.minValue, prev.maxValue - step);
//               newState.maxValue = newValue;
//             }
//           }
//         } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
//           e.preventDefault();
//           if (props.mode === 'fixed') {
//             const values = props.config.rangeValues;
//             if (values.length === 0) return prev;

//             if (handle === 'min' && prev.minIndex < prev.maxIndex) {
//               const newIndex = prev.minIndex + 1;
//               newState.minIndex = newIndex;
//               newState.minValue = values[newIndex];
//             } else if (handle === 'max' && prev.maxIndex < values.length - 1) {
//               const newIndex = prev.maxIndex + 1;
//               newState.maxIndex = newIndex;
//               newState.maxValue = values[newIndex];
//             }
//           } else {
//             if (handle === 'min') {
//               const newValue = Math.min(prev.maxValue, prev.minValue + step);
//               newState.minValue = newValue;
//             } else {
//               const newValue = Math.min(props.config.max, prev.maxValue + step);
//               if (newValue >= prev.minValue) newState.maxValue = newValue;
//             }
//           }
//         }

//         return newState;
//       });
//     },
//     [props]
//   );

//   // Format value for display
//   const formatValue = useCallback(
//     (value: number) => {
//       if (value === undefined || value === null) return '0';

//       if (props.mode === 'fixed') {
//         return `${value.toFixed(2)}€`;
//       }
//       return Math.round(value).toString();
//     },
//     [props.mode]
//   );

//   // Safe ARIA value getters
//   const getAriaValueMin = useCallback(() => {
//     if (props.mode === 'normal') {
//       return props.config.min;
//     }
//     return props.config.rangeValues.length > 0 ? props.config.rangeValues[0] : 0;
//   }, [props]);

//   const getAriaValueMax = useCallback(() => {
//     if (props.mode === 'normal') {
//       return props.config.max;
//     }
//     return props.config.rangeValues.length > 0
//       ? props.config.rangeValues[props.config.rangeValues.length - 1]
//       : 0;
//   }, [props]);

//   // return (
//   //   <div className={styles.container}>
//   //     <div className={styles.values}>
//   //       <span className={styles.minValue}>{formatValue(state.minValue)}</span>
//   //       <span className={styles.maxValue}>{formatValue(state.maxValue)}</span>
//   //     </div>

//   //     <div
//   //       className={styles.rangeContainer}
//   //       onPointerMove={handlePointerMove}
//   //       onPointerUp={handlePointerUp}
//   //     >
//   //       <div
//   //         ref={trackRef}
//   //         className={styles.track}
//   //         role='slider'
//   //         aria-label={`Range slider from ${formatValue(state.minValue)} to ${formatValue(
//   //           state.maxValue
//   //         )}`}
//   //       >
//   //         <div
//   //           className={styles.range}
//   //           style={{
//   //             left: `${valueToPercentage(state.minValue)}%`,
//   //             width: `${valueToPercentage(state.maxValue) - valueToPercentage(state.minValue)}%`
//   //           }}
//   //         />

//   //         <button
//   //           className={`${styles.handle} ${styles.minHandle} ${
//   //             isDragging && dragHandle === 'min' ? styles.dragging : ''
//   //           }`}
//   //           style={{ left: `${valueToPercentage(state.minValue)}%` }}
//   //           onPointerDown={handlePointerDown('min')}
//   //           onKeyDown={handleKeyDown('min')}
//   //           aria-label={`Minimum value: ${formatValue(state.minValue)}`}
//   //           aria-valuemin={getAriaValueMin()}
//   //           aria-valuemax={getAriaValueMax()}
//   //           aria-valuenow={state.minValue}
//   //           role='slider'
//   //           tabIndex={0}
//   //         />

//   //         <button
//   //           className={`${styles.handle} ${styles.maxHandle} ${
//   //             isDragging && dragHandle === 'max' ? styles.dragging : ''
//   //           }`}
//   //           style={{ left: `${valueToPercentage(state.maxValue)}%` }}
//   //           onPointerDown={handlePointerDown('max')}
//   //           onKeyDown={handleKeyDown('max')}
//   //           aria-label={`Maximum value: ${formatValue(state.maxValue)}`}
//   //           aria-valuemin={getAriaValueMin()}
//   //           aria-valuemax={getAriaValueMax()}
//   //           aria-valuenow={state.maxValue}
//   //           role='slider'
//   //           tabIndex={0}
//   //         />
//   //       </div>
//   //     </div>
//   //   </div>
//   // );
//   return (
//     <div className={styles.container}>
//       <div
//         className={styles.rangeContainer}
//         onPointerMove={handlePointerMove}
//         onPointerUp={handlePointerUp}
//       >
//         {/* Dynamic Min Value Label - This will now change */}
//         <span className={styles.rangeLabel}>{formatValue(state.minValue)}</span>

//         {/* The main slider track and handles */}
//         <div
//           ref={trackRef}
//           className={styles.track}
//           role='slider'
//           aria-label={`Range slider from ${formatValue(state.minValue)} to ${formatValue(
//             state.maxValue
//           )}`}
//         >
//           <div
//             className={styles.range}
//             style={{
//               left: `${valueToPercentage(state.minValue)}%`,
//               width: `${valueToPercentage(state.maxValue) - valueToPercentage(state.minValue)}%`
//             }}
//           />

//           <button
//             className={`${styles.handle} ${styles.minHandle} ${
//               isDragging && dragHandle === 'min' ? styles.dragging : ''
//             }`}
//             style={{ left: `${valueToPercentage(state.minValue)}%` }}
//             onPointerDown={handlePointerDown('min')}
//             onKeyDown={handleKeyDown('min')}
//             aria-label={`Minimum value: ${formatValue(state.minValue)}`}
//             aria-valuemin={getAriaValueMin()}
//             aria-valuemax={getAriaValueMax()}
//             aria-valuenow={state.minValue}
//             role='slider'
//             tabIndex={0}
//           />

//           <button
//             className={`${styles.handle} ${styles.maxHandle} ${
//               isDragging && dragHandle === 'max' ? styles.dragging : ''
//             }`}
//             style={{ left: `${valueToPercentage(state.maxValue)}%` }}
//             onPointerDown={handlePointerDown('max')}
//             onKeyDown={handleKeyDown('max')}
//             aria-label={`Maximum value: ${formatValue(state.maxValue)}`}
//             aria-valuemin={getAriaValueMin()}
//             aria-valuemax={getAriaValueMax()}
//             aria-valuenow={state.maxValue}
//             role='slider'
//             tabIndex={0}
//           />
//         </div>

//         {/* Dynamic Max Value Label - This will now change */}
//         <span className={styles.rangeLabel}>{formatValue(state.maxValue)}</span>
//       </div>
//     </div>
//   );
// }

// 'use client';

// import { useState, useRef, useCallback, useEffect } from 'react';
// import { RangeProps } from './Range.types';
// import styles from './Range.module.css';

// export default function Range(props: RangeProps) {
//   const trackRef = useRef<HTMLDivElement>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragHandle, setDragHandle] = useState<'min' | 'max' | null>(null);

//   // Initialize values based on mode
//   const getInitialValues = useCallback(() => {
//     if (props.mode === 'normal') {
//       const { min, max } = props.config;
//       return {
//         minValue: min,
//         maxValue: max,
//         minIndex: 0,
//         maxIndex: 0
//       };
//     } else {
//       const values = props.config.rangeValues;
//       if (values.length === 0) {
//         return {
//           minValue: 0,
//           maxValue: 0,
//           minIndex: 0,
//           maxIndex: 0
//         };
//       }
//       return {
//         minValue: values[0],
//         maxValue: values[values.length - 1],
//         minIndex: 0,
//         maxIndex: values.length - 1
//       };
//     }
//   }, [props]);

//   const [state, setState] = useState(() => getInitialValues());

//   // Convert pixel position to value
//   const pixelToValue = useCallback(
//     (clientX: number) => {
//       if (!trackRef.current) return 0;

//       const rect = trackRef.current.getBoundingClientRect();
//       const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         return min + percentage * (max - min);
//       } else {
//         const values = props.config.rangeValues;
//         const index = Math.round(percentage * (values.length - 1));
//         return values[index];
//       }
//     },
//     [props]
//   );

//   // Convert value to pixel percentage
//   const valueToPercentage = useCallback(
//     (value: number) => {
//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         return ((value - min) / (max - min)) * 100;
//       } else {
//         const values = props.config.rangeValues;
//         const index = values.indexOf(value);
//         return (index / (values.length - 1)) * 100;
//       }
//     },
//     [props]
//   );

//   // Handle mouse/touch events
//   const handlePointerDown = useCallback(
//     (handle: 'min' | 'max') => (e: React.PointerEvent) => {
//       e.preventDefault();
//       setIsDragging(true);
//       setDragHandle(handle);

//       // Only use pointer capture if available (not in test environment)
//       const target = e.currentTarget as HTMLElement;
//       if (target.setPointerCapture) {
//         target.setPointerCapture(e.pointerId);
//       }
//     },
//     []
//   );

//   const handlePointerMove = useCallback(
//     (e: React.PointerEvent) => {
//       if (!isDragging || !dragHandle) return;

//       const newValue = pixelToValue(e.clientX);

//       setState(prev => {
//         let newState = { ...prev };

//         if (props.mode === 'fixed') {
//           const values = props.config.rangeValues;
//           if (values.length === 0) return prev;

//           const newIndex = values.indexOf(newValue);

//           if (dragHandle === 'min') {
//             if (newIndex <= newState.maxIndex) {
//               newState.minValue = newValue;
//               newState.minIndex = newIndex;
//             }
//           } else {
//             if (newIndex >= newState.minIndex) {
//               newState.maxValue = newValue;
//               newState.maxIndex = newIndex;
//             }
//           }
//         } else {
//           if (dragHandle === 'min') {
//             if (newValue <= newState.maxValue) {
//               newState.minValue = newValue;
//             }
//           } else {
//             if (newValue >= newState.minValue) {
//               newState.maxValue = newValue;
//             }
//           }
//         }

//         return newState;
//       });
//     },
//     [isDragging, dragHandle, pixelToValue, props]
//   );

//   const handlePointerUp = useCallback((e: React.PointerEvent) => {
//     setIsDragging(false);
//     setDragHandle(null);

//     // Only use pointer capture if available (not in test environment)
//     const target = e.currentTarget as HTMLElement;
//     if (target.releasePointerCapture) {
//       target.releasePointerCapture(e.pointerId);
//     }
//   }, []);

//   // Keyboard navigation
//   const handleKeyDown = useCallback(
//     (handle: 'min' | 'max') => (e: React.KeyboardEvent) => {
//       let step = 1;

//       if (props.mode === 'normal') {
//         const { min, max } = props.config;
//         step = (max - min) / 100; // 1% steps
//       }

//       setState(prev => {
//         let newState = { ...prev };

//         if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
//           e.preventDefault();
//           if (props.mode === 'fixed') {
//             const values = props.config.rangeValues;
//             if (handle === 'min' && prev.minIndex > 0) {
//               const newIndex = prev.minIndex - 1;
//               newState.minIndex = newIndex;
//               newState.minValue = values[newIndex];
//             } else if (handle === 'max' && prev.maxIndex > prev.minIndex) {
//               const newIndex = prev.maxIndex - 1;
//               newState.maxIndex = newIndex;
//               newState.maxValue = values[newIndex];
//             }
//           } else {
//             if (handle === 'min') {
//               const newValue = Math.max(props.config.min, prev.minValue - step);
//               if (newValue <= prev.maxValue) newState.minValue = newValue;
//             } else {
//               const newValue = Math.max(prev.minValue, prev.maxValue - step);
//               newState.maxValue = newValue;
//             }
//           }
//         } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
//           e.preventDefault();
//           if (props.mode === 'fixed') {
//             const values = props.config.rangeValues;
//             if (handle === 'min' && prev.minIndex < prev.maxIndex) {
//               const newIndex = prev.minIndex + 1;
//               newState.minIndex = newIndex;
//               newState.minValue = values[newIndex];
//             } else if (handle === 'max' && prev.maxIndex < values.length - 1) {
//               const newIndex = prev.maxIndex + 1;
//               newState.maxIndex = newIndex;
//               newState.maxValue = values[newIndex];
//             }
//           } else {
//             if (handle === 'min') {
//               const newValue = Math.min(prev.maxValue, prev.minValue + step);
//               newState.minValue = newValue;
//             } else {
//               const newValue = Math.min(props.config.max, prev.maxValue + step);
//               if (newValue >= prev.minValue) newState.maxValue = newValue;
//             }
//           }
//         }

//         return newState;
//       });
//     },
//     [props]
//   );

//   // Format value for display
//   const formatValue = useCallback(
//     (value: number) => {
//       if (value === undefined || value === null) return '0';

//       if (props.mode === 'fixed') {
//         return `${value.toFixed(2)}€`;
//       }
//       return Math.round(value).toString();
//     },
//     [props.mode]
//   );

//   return (
//     <div className={styles.container}>
//       <div className={styles.values}>
//         <span className={styles.minValue}>{formatValue(state.minValue)}</span>
//         <span className={styles.maxValue}>{formatValue(state.maxValue)}</span>
//       </div>

//       <div className={styles.rangeContainer}>
//         <div
//           ref={trackRef}
//           className={styles.track}
//           role='slider'
//           aria-label={`Range slider from ${formatValue(state.minValue)} to ${formatValue(
//             state.maxValue
//           )}`}
//         >
//           <div
//             className={styles.range}
//             style={{
//               left: `${valueToPercentage(state.minValue)}%`,
//               width: `${valueToPercentage(state.maxValue) - valueToPercentage(state.minValue)}%`
//             }}
//           />

//           <button
//             className={`${styles.handle} ${styles.minHandle} ${
//               isDragging && dragHandle === 'min' ? styles.dragging : ''
//             }`}
//             style={{ left: `${valueToPercentage(state.minValue)}%` }}
//             onPointerDown={handlePointerDown('min')}
//             onPointerMove={handlePointerMove}
//             onPointerUp={handlePointerUp}
//             onKeyDown={handleKeyDown('min')}
//             aria-label={`Minimum value: ${formatValue(state.minValue)}`}
//             aria-valuemin={props.mode === 'normal' ? props.config.min : props.config.rangeValues[0]}
//             aria-valuemax={
//               props.mode === 'normal'
//                 ? props.config.max
//                 : props.config.rangeValues[props.config.rangeValues.length - 1]
//             }
//             aria-valuenow={state.minValue}
//             role='slider'
//             tabIndex={0}
//           />

//           <button
//             className={`${styles.handle} ${styles.maxHandle} ${
//               isDragging && dragHandle === 'max' ? styles.dragging : ''
//             }`}
//             style={{ left: `${valueToPercentage(state.maxValue)}%` }}
//             onPointerDown={handlePointerDown('max')}
//             onPointerMove={handlePointerMove}
//             onPointerUp={handlePointerUp}
//             onKeyDown={handleKeyDown('max')}
//             aria-label={`Maximum value: ${formatValue(state.maxValue)}`}
//             aria-valuemin={props.mode === 'normal' ? props.config.min : props.config.rangeValues[0]}
//             aria-valuemax={
//               props.mode === 'normal'
//                 ? props.config.max
//                 : props.config.rangeValues[props.config.rangeValues.length - 1]
//             }
//             aria-valuenow={state.maxValue}
//             role='slider'
//             tabIndex={0}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
