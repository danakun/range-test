// API res types
export interface RangeConfig {
  min: number;
  max: number;
}

export interface FixedValuesConfig {
  rangeValues: number[];
}

// Component props
export interface NormalRangeProps {
  mode: 'normal';
  config: RangeConfig;
}

export interface FixedRangeProps {
  mode: 'fixed';
  config: FixedValuesConfig;
}

export type RangeProps = NormalRangeProps | FixedRangeProps;

// Production Note: This discriminated union approach works well for the current 2 modes but violates the Open/Closed Principle when adding new modes (requires modifying existing code).
// For production systems expecting frequent mode additions we can use:
// - Strategy Pattern: Create separate classes implementing a common RangeStrategy interface
// - Factory Pattern: Use a registry to map mode strings to component implementations
// It keeps the codebase extensible without modifying.
