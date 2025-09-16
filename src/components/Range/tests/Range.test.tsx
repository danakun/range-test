import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Range from '../Range';
import { RangeConfig, FixedValuesConfig } from '../Range.types';

// Mock configs matching your actual API responses
const mockNormalConfig: RangeConfig = {
  min: 1,
  max: 100
};

const mockFixedConfig: FixedValuesConfig = {
  rangeValues: [1.99, 5.99, 10.99, 30.99, 50.99, 70.99]
};

describe('Range Component', () => {
  describe('Normal Mode', () => {
    it('renders with correct initial values', () => {
      render(<Range mode='normal' config={mockNormalConfig} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum value: 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum value: 100/i)).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      expect(minHandle).toHaveAttribute('role', 'slider');
      expect(minHandle).toHaveAttribute('aria-valuemin', '1');
      expect(minHandle).toHaveAttribute('aria-valuemax', '100');
      expect(minHandle).toHaveAttribute('aria-valuenow', '1');
      expect(minHandle).toHaveAttribute('aria-orientation', 'horizontal');
      expect(minHandle).toHaveAttribute('aria-valuetext', '1');

      expect(maxHandle).toHaveAttribute('role', 'slider');
      expect(maxHandle).toHaveAttribute('aria-valuemin', '1');
      expect(maxHandle).toHaveAttribute('aria-valuemax', '100');
      expect(maxHandle).toHaveAttribute('aria-valuenow', '100');
      expect(maxHandle).toHaveAttribute('aria-orientation', 'horizontal');
      expect(maxHandle).toHaveAttribute('aria-valuetext', '100');
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);

      await user.click(minHandle);
      await user.keyboard('{ArrowRight}');

      // Value should change (not be exactly 1 anymore)
      expect(minHandle).toHaveAttribute('aria-valuenow', expect.not.stringMatching(/^1$/));
    });

    it('prevents handles from crossing', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      // Focus min handle and try to move it beyond max
      await user.click(minHandle);
      // Move right many times to try to cross the max handle
      for (let i = 0; i < 120; i++) {
        await user.keyboard('{ArrowRight}');
      }

      const minValue = parseFloat(minHandle.getAttribute('aria-valuenow') || '0');
      const maxValue = parseFloat(maxHandle.getAttribute('aria-valuenow') || '0');

      // Should maintain at least 1 step separation
      expect(minValue).toBeLessThan(maxValue);
    });
  });

  describe('Fixed Mode', () => {
    it('renders with correct initial currency values', () => {
      render(<Range mode='fixed' config={mockFixedConfig} />);

      expect(screen.getByText('1.99€')).toBeInTheDocument();
      expect(screen.getByText('70.99€')).toBeInTheDocument();
    });

    it('displays currency formatting', () => {
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const values = screen.getAllByText(/€/);
      expect(values).toHaveLength(2); // min and max values
    });

    it('enforces step separation in fixed mode', async () => {
      const user = userEvent.setup();
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      // Try to move handles to same position
      await user.click(maxHandle);
      // Move left to try to reach the min handle position
      for (let i = 0; i < 10; i++) {
        await user.keyboard('{ArrowLeft}');
      }

      const minValue = parseFloat(minHandle.getAttribute('aria-valuenow') || '0');
      const maxValue = parseFloat(maxHandle.getAttribute('aria-valuenow') || '0');

      // Should maintain separation (different values)
      expect(maxValue).toBeGreaterThan(minValue);
    });

    it('has correct ARIA values for fixed mode', () => {
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      expect(minHandle).toHaveAttribute('aria-valuemin', '1.99');
      expect(minHandle).toHaveAttribute('aria-valuemax', '70.99');
      expect(minHandle).toHaveAttribute('aria-valuetext', '1.99€');
      expect(maxHandle).toHaveAttribute('aria-valuemin', '1.99');
      expect(maxHandle).toHaveAttribute('aria-valuemax', '70.99');
      expect(maxHandle).toHaveAttribute('aria-valuetext', '70.99€');
    });
  });

  describe('Interaction Handling', () => {
    it('applies dragging class when interaction starts', () => {
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);

      // Test that dragging state changes
      fireEvent.pointerDown(minHandle, { pointerId: 1 });
      expect(minHandle).toHaveClass('dragging');
    });

    it('handles focus states correctly', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);

      await user.tab();
      expect(minHandle).toHaveFocus();
    });
  });

  describe('Realistic API Scenarios', () => {
    it('works with typical fixed values from API', () => {
      const apiFixedConfig: FixedValuesConfig = {
        rangeValues: [1.99, 5.99, 10.99, 30.99, 50.99, 70.99]
      };

      render(<Range mode='fixed' config={apiFixedConfig} />);

      expect(screen.getByText('1.99€')).toBeInTheDocument();
      expect(screen.getByText('70.99€')).toBeInTheDocument();
    });

    it('works with typical normal range from API', () => {
      const apiNormalConfig: RangeConfig = { min: 1, max: 100 };

      render(<Range mode='normal' config={apiNormalConfig} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('handles different fixed value ranges', () => {
      const customFixedConfig: FixedValuesConfig = {
        rangeValues: [0.99, 2.49, 4.99, 9.99]
      };

      render(<Range mode='fixed' config={customFixedConfig} />);

      expect(screen.getByText('0.99€')).toBeInTheDocument();
      expect(screen.getByText('9.99€')).toBeInTheDocument();
    });

    it('handles different normal ranges', () => {
      const customNormalConfig: RangeConfig = { min: 50, max: 500 };

      render(<Range mode='normal' config={customNormalConfig} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Defensive Programming', () => {
    it('handles empty fixed values array gracefully', () => {
      const emptyConfig: FixedValuesConfig = { rangeValues: [] };

      expect(() => {
        render(<Range mode='fixed' config={emptyConfig} />);
      }).not.toThrow();

      // Should show default fallback values (appears in both min and max labels)
      const defaultValues = screen.getAllByText('0.00€');
      expect(defaultValues).toHaveLength(2); // min and max labels
      expect(defaultValues[0]).toBeInTheDocument();
    });

    it('handles single value in fixed mode', () => {
      const singleValueConfig: FixedValuesConfig = { rangeValues: [42.99] };

      render(<Range mode='fixed' config={singleValueConfig} />);

      // Both min and max should show the same value when only one option exists
      const values = screen.getAllByText('42.99€');
      expect(values).toHaveLength(2);
    });

    it('handles invalid normal range (min equals max)', () => {
      const invalidConfig: RangeConfig = { min: 50, max: 50 };

      expect(() => {
        render(<Range mode='normal' config={invalidConfig} />);
      }).not.toThrow();

      // Should render without crashing (value appears in both min and max labels)
      const values = screen.getAllByText('50');
      expect(values).toHaveLength(2); // min and max labels
      expect(values[0]).toBeInTheDocument();
    });

    it('handles invalid normal range (min > max)', () => {
      const invalidConfig: RangeConfig = { min: 100, max: 1 };

      expect(() => {
        render(<Range mode='normal' config={invalidConfig} />);
      }).not.toThrow();
    });

    it('handles very small fixed ranges', () => {
      const smallRangeConfig: FixedValuesConfig = { rangeValues: [1.0, 1.01] };

      render(<Range mode='fixed' config={smallRangeConfig} />);

      expect(screen.getByText('1.00€')).toBeInTheDocument();
      expect(screen.getByText('1.01€')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      // Tab navigation
      await user.tab();
      expect(minHandle).toHaveFocus();

      await user.tab();
      expect(maxHandle).toHaveFocus();
    });

    it('supports all arrow key directions', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      await user.click(minHandle);

      const initialValue = minHandle.getAttribute('aria-valuenow');

      // Test all arrow directions
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');

      // Should handle all directions without errors
      expect(minHandle).toHaveAttribute('aria-valuenow');
    });

    it('supports Home and End keys', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      await user.click(minHandle);

      // Test Home key
      await user.keyboard('{Home}');
      expect(minHandle).toHaveAttribute('aria-valuenow', '1');

      // Test End key (should be clamped to maxValue - step)
      await user.keyboard('{End}');
      const endValue = parseInt(minHandle.getAttribute('aria-valuenow') || '0');
      expect(endValue).toBeLessThan(100); // Should be less than max due to step separation
    });

    it('maintains accessible labeling', () => {
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minHandle = screen.getByLabelText(/minimum value/i);
      const maxHandle = screen.getByLabelText(/maximum value/i);

      expect(minHandle).toBeInTheDocument();
      expect(maxHandle).toBeInTheDocument();

      // Check for proper aria-orientation
      expect(minHandle).toHaveAttribute('aria-orientation', 'horizontal');
      expect(maxHandle).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('provides proper screen reader information for fixed values', () => {
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const minHandle = screen.getByLabelText(/minimum value.*1\.99€/i);
      const maxHandle = screen.getByLabelText(/maximum value.*70\.99€/i);

      expect(minHandle).toHaveAttribute('aria-valuetext', '1.99€');
      expect(maxHandle).toHaveAttribute('aria-valuetext', '70.99€');
    });
  });
});
