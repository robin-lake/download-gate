import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewSmartLink from './NewSmartLink';

const mockCreateSmartLink = vi.fn();
const mockUploadCoverArt = vi.fn();
const mockUploadAudio = vi.fn();
const mockNavigate = vi.fn();
const mockGetToken = vi.fn().mockResolvedValue('mock-token');

vi.mock('../../network/smartLinks/createSmartLink', () => ({
  createSmartLink: (...args: unknown[]) => mockCreateSmartLink(...args),
}));

vi.mock('../../network/media/uploadMedia', () => ({
  uploadCoverArt: (...args: unknown[]) => mockUploadCoverArt(...args),
  uploadAudio: (...args: unknown[]) => mockUploadAudio(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@clerk/clerk-react', async () => {
  const actual = await vi.importActual<typeof import('@clerk/clerk-react')>('@clerk/clerk-react');
  return {
    ...actual,
    useAuth: () => ({ getToken: mockGetToken }),
  };
});

function renderNewSmartLink() {
  return render(
    <MemoryRouter>
      <NewSmartLink />
    </MemoryRouter>
  );
}

describe('NewSmartLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadCoverArt.mockResolvedValue({ url: 'https://example.com/cover.jpg', key: 'cover.jpg' });
    mockUploadAudio.mockResolvedValue({ url: 'https://example.com/audio.mp3', key: 'audio.mp3' });
    mockCreateSmartLink.mockResolvedValue({
      link_id: 'link-123',
      title: 'x',
      short_url: 'x',
      total_visits: 0,
      total_clicks: 0,
    });
  });

  it('renders the form', () => {
    renderNewSmartLink();
    expect(screen.getByRole('heading', { name: /create new smart link/i })).toBeInTheDocument();
  });

  it('renders Design step with cover art and Audio step with required label', () => {
    renderNewSmartLink();
    expect(screen.getAllByText(/cover art/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/audio is required/i).length).toBeGreaterThan(0);
  });
});
