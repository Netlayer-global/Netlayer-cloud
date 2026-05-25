import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Server } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    render(
      <MemoryRouter>
        <EmptyState icon={Server} title="No servers yet" subtitle="Deploy your first" />
      </MemoryRouter>
    )
    expect(screen.getByText('No servers yet')).toBeInTheDocument()
    expect(screen.getByText('Deploy your first')).toBeInTheDocument()
  })

  it('renders primary action as Link when `to` is provided', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon={Server}
          title="Empty"
          action={{ label: 'Deploy now', to: '/dashboard/deploy' }}
        />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /Deploy now/i })
    expect(link).toHaveAttribute('href', '/dashboard/deploy')
  })

  it('renders secondary action below primary', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon={Server}
          title="Empty"
          action={{ label: 'Primary' }}
          secondaryAction={{ label: 'Skip for now' }}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Primary')).toBeInTheDocument()
    expect(screen.getByText('Skip for now')).toBeInTheDocument()
  })
})
