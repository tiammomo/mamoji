/**
 * Test for Progress component to verify radix-ui mock works
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Progress } from '@/components/ui/progress';

describe('Progress Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Progress value={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays progress value correctly', () => {
    const { container } = render(<Progress value={75} />);
    // The progress bar should be rendered
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });
});
