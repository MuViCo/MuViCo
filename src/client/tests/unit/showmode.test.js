import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ShowMode from '../../components/presentation/ShowMode'
import "@testing-library/jest-dom"

const mockCues = [
    { file: { url: 'http://example.com/image1.jpg' }, index: 0, name: 'testtt', screen: 1, _id: '123456789' },
    { file: { url: 'http://example.com/image2.jpg' }, index: 1, name: 'testtt2', screen: 2, _id: '987654321' },
]

const mockemptyCues = []

describe('ShowMode', () => {
    test('renders without crashing', async () => {
      await act(async () => {
        render(<ShowMode cues={mockCues} />)
      })
      
      expect(screen.getByRole('button', { name: 'Open screen: 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open screen: 2' })).toBeInTheDocument()
    })

    test('initializes state correctly', async () => {
        await act(async () => {
          render(<ShowMode cues={mockCues} />)
        })
        
        expect(screen.getByRole('heading', { name: 'Cue 0' })).toBeInTheDocument()
        
        expect(screen.getByRole('button', { name: 'Open screen: 1' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Open screen: 2' })).toBeInTheDocument()
    })

    test('navigates to next and previous cues', async () => {
        await act(async () => {
          render(<ShowMode cues={mockCues} />)
        })
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Next Cue' }))
        })
        expect(screen.getByRole('heading', { name: 'Cue 1' })).toBeInTheDocument()
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Previous Cue' }))
        })
        expect(screen.getByRole('heading', { name: 'Cue 0' })).toBeInTheDocument()
    })

    test('toggles screen visibility', async () => {
        await act(async () => {
          render(<ShowMode cues={mockCues} />)
        })
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Open screen: 1' }))
        })
        expect(screen.getByRole('button', { name: 'Close screen: 1' })).toBeInTheDocument()
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Close screen: 1' }))
        })
        expect(screen.getByRole('button', { name: 'Open screen: 1' })).toBeInTheDocument()
    })

    test('toggles visibility for multiple screens', async () => {
        await act(async () => {
          render(<ShowMode cues={mockCues} />);
        })
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Open screen: 1' }));
        })
        expect(screen.getByRole('button', { name: 'Close screen: 1' })).toBeInTheDocument()
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Open screen: 2' }));
        })
        expect(screen.getByRole('button', { name: 'Close screen: 2' })).toBeInTheDocument()
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Close screen: 1' }));
        })
        expect(screen.getByRole('button', { name: 'Open screen: 1' })).toBeInTheDocument()
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Close screen: 2' }));
        })
        expect(screen.getByRole('button', { name: 'Open screen: 2' })).toBeInTheDocument()
    })
    
    test('handles empty cues', async () => {
        await act(async () => {
          render(<ShowMode cues={mockemptyCues} />)
        })
        expect(screen.queryByRole('button', { name: 'Open screen: 1' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Open screen: 2' })).not.toBeInTheDocument()
    })
})