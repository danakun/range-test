import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Range from '../Range';
import { RangeConfig, FixedValuesConfig } from '../Range.types';

const mockNormalConfig: RangeConfig = {
  min: 1,
  max: 100
};

const mockFixedConfig: FixedValuesConfig = {
  rangeValues: [1.99, 5.99, 10.99, 30.99, 50.99, 70.99]
};

describe('Range Component', () => {
  describe('Normal Mode', () => {
    it('renders correctly', () => {
      render(<Range mode='normal' config={mockNormalConfig} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('prevents handles from crossing', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);
      const minHandle = screen.getByRole('slider', { name: /minimum value: 1/i });
      const maxHandle = screen.getByRole('slider', { name: /maximum value: 100/i });
      await user.click(minHandle);
      for (let i = 0; i < 120; i++) {
        await user.keyboard('{ArrowRight}');
      }
      const minValue = parseFloat(minHandle.getAttribute('aria-valuenow') || '0');
      const maxValue = parseFloat(maxHandle.getAttribute('aria-valuenow') || '0');
      expect(minValue).toBeLessThan(maxValue);
    });
  });

  describe('Normal Mode - Label Editing', () => {
    it('allows clicking labels to edit values and submits on Enter', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minLabel = screen.getByText('1');
      await user.click(minLabel);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(1);

      fireEvent.change(input, { target: { value: '25' } });
      expect(input).toHaveValue(25);

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      });
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('clamps values to valid range', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minLabel = screen.getByText('1');
      await user.click(minLabel);

      const input = screen.getByRole('spinbutton');

      fireEvent.change(input, { target: { value: '150' } });
      expect(input).toHaveValue(150);

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      });
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('cancels editing with Escape key', async () => {
      const user = userEvent.setup();
      render(<Range mode='normal' config={mockNormalConfig} />);

      const minLabel = screen.getByText('1');
      await user.click(minLabel);

      const input = screen.getByRole('spinbutton');

      fireEvent.change(input, { target: { value: '50' } });
      expect(input).toHaveValue(50);

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      });
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Fixed Mode', () => {
    it('renders correctly', () => {
      render(<Range mode='fixed' config={mockFixedConfig} />);
      expect(screen.getByText('1.99€')).toBeInTheDocument();
      expect(screen.getByText('70.99€')).toBeInTheDocument();
    });

    it('maintains step separation and only shows valid values', async () => {
      const user = userEvent.setup();
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const minHandle = screen.getByRole('slider', { name: /minimum value.*1\.99€/i });
      const maxHandle = screen.getByRole('slider', { name: /maximum value.*70\.99€/i });

      await user.click(maxHandle);
      for (let i = 0; i < 10; i++) {
        await user.keyboard('{ArrowLeft}');
      }

      const minValue = parseFloat(minHandle.getAttribute('aria-valuenow') || '0');
      const maxValue = parseFloat(maxHandle.getAttribute('aria-valuenow') || '0');

      expect(maxValue).toBeGreaterThan(minValue);
      expect(mockFixedConfig.rangeValues).toContain(minValue);
      expect(mockFixedConfig.rangeValues).toContain(maxValue);
      expect(screen.queryByText('69.99€')).not.toBeInTheDocument();
    });

    it('does not allow editing labels', async () => {
      const user = userEvent.setup();
      render(<Range mode='fixed' config={mockFixedConfig} />);

      const minLabel = screen.getByText('1.99€');
      await user.click(minLabel);

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty fixed values', () => {
      const emptyConfig: FixedValuesConfig = { rangeValues: [] };
      render(<Range mode='fixed' config={emptyConfig} />);
      const defaultValues = screen.getAllByText('0.00€');
      expect(defaultValues).toHaveLength(2);
    });

    it('handles single fixed value', () => {
      const singleConfig: FixedValuesConfig = { rangeValues: [42.99] };
      render(<Range mode='fixed' config={singleConfig} />);
      const values = screen.getAllByText('42.99€');
      expect(values).toHaveLength(2);
    });
  });
});
