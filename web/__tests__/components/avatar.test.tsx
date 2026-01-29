/**
 * Test for Avatar component to verify radix-ui mock works
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="test.jpg" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays fallback when no image', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
});
