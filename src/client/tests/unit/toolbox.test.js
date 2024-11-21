import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbox from '../../components/presentation/ToolBox.jsx';
import '@testing-library/jest-dom'

describe('ToolBox Component', () => {
  const mockAddCue = jest.fn();
  const mockOnClose = jest.fn();
  const position = { index: 1, screen: 1 };

  it('renders correctly when open', () => {
    render(<Toolbox addCue={mockAddCue} isOpen={true} onClose={mockOnClose} position={position} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('close-drawer-button')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<Toolbox addCue={mockAddCue} isOpen={true} onClose={mockOnClose} position={position} />);

    fireEvent.click(screen.getByTestId('close-drawer-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    render(<Toolbox addCue={mockAddCue} isOpen={false} onClose={mockOnClose} position={position} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});