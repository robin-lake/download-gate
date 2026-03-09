import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewSmartLink from './NewSmartLink';

const mockCreateSmartLink = vi.fn();
const mockNavigate = vi.fn();

const mockUseCreateSmartLink = vi.fn(() => ({
  createSmartLink: mockCreateSmartLink,
  status: 'idle' as const,
  data: null,
  error: null,
  isLoading: false,
  refetch: vi.fn(),
}));

vi.mock('../../network/smartLinks/createSmartLink', () => ({
  useCreateSmartLink: () => mockUseCreateSmartLink(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    mockUseCreateSmartLink.mockReturnValue({
      createSmartLink: mockCreateSmartLink,
      status: 'idle',
      data: null,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('calls createSmartLink with payload when form is submitted', async () => {
    const { container } = renderNewSmartLink();

    fireEvent.change(container.querySelector('#source-url')!, {
      target: { value: 'https://example.com/track' },
    });
    fireEvent.change(container.querySelector('#title')!, {
      target: { value: 'My New Track' },
    });
    fireEvent.change(container.querySelector('#shortCode')!, {
      target: { value: 'my-new-track' },
    });

    const form = container.querySelector('form.new-smart-link__form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateSmartLink).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateSmartLink.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'My New Track',
      short_url: 'my-new-track',
    });
    expect(typeof payload.short_url).toBe('string');
  });

  it('derives short_url from title when short code is left blank', async () => {
    const { container } = renderNewSmartLink();

    fireEvent.change(container.querySelector('#source-url')!, {
      target: { value: 'https://example.com/track' },
    });
    fireEvent.change(container.querySelector('#title')!, {
      target: { value: 'Summer Hit' },
    });

    const form = container.querySelector('form.new-smart-link__form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCreateSmartLink).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateSmartLink.mock.calls[0][0];
    expect(payload.short_url).toBe('summer-hit');
    expect(payload.title).toBe('Summer Hit');
  });

  it('navigates to dashboard with created link id when create succeeds', async () => {
    mockUseCreateSmartLink.mockReturnValue({
      createSmartLink: mockCreateSmartLink,
      status: 'success',
      data: { link_id: 'link-123', title: 'x', short_url: 'x', total_visits: 0, total_clicks: 0 },
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    renderNewSmartLink();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        state: { createdSmartLinkId: 'link-123' },
      });
    });
  });

  it('shows root error when create fails', async () => {
    mockUseCreateSmartLink.mockReturnValue({
      createSmartLink: mockCreateSmartLink,
      status: 'error',
      data: null,
      error: new Error('API failed'),
      isLoading: false,
      refetch: vi.fn(),
    });

    renderNewSmartLink();

    await waitFor(() => {
      expect(screen.getByRole('alert', { hidden: true })).toHaveTextContent('API failed');
    });
  });

  it('disables submit button while submitting', async () => {
    mockUseCreateSmartLink.mockReturnValue({
      createSmartLink: mockCreateSmartLink,
      status: 'idle',
      data: null,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    });

    const { container } = renderNewSmartLink();

    fireEvent.change(container.querySelector('#source-url')!, {
      target: { value: 'https://example.com/track' },
    });
    fireEvent.change(container.querySelector('#title')!, { target: { value: 'Track' } });
    const submitButtons = screen.getAllByRole('button', { name: /create/i, hidden: true });
    const submitButton = submitButtons.find((el) => (el as HTMLButtonElement).type === 'submit');
    expect(submitButton).toBeDefined();
    expect(submitButton).not.toBeDisabled();

    fireEvent.submit(container.querySelector('form.new-smart-link__form')!);

    await waitFor(() => {
      expect(mockCreateSmartLink).toHaveBeenCalled();
    });

    await waitFor(() => {
      const btn = screen.getAllByRole('button', { name: /creating/i, hidden: true }).find(
        (el) => (el as HTMLButtonElement).type === 'submit'
      );
      expect(btn).toBeDefined();
      expect(btn).toBeDisabled();
    });
  });
});
