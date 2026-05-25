import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EHRUpload from '../EHRUpload';

// Mock routing
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../../../services/ehr-service', () => ({
  default: {
    extractFromText: vi.fn(),
    extractFromFile: vi.fn(),
  },
}));

// Mock framer-motion to simplify JSDOM rendering and speed up execution
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'vi' }
  })
}));

describe('EHRUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text intake mode by default', () => {
    render(
      <MemoryRouter>
        <EHRUpload />
      </MemoryRouter>
    );

    expect(screen.getByText('Clinical Intake')).toBeInTheDocument();
    expect(screen.getByText('Văn bản lâm sàng')).toBeInTheDocument();
    expect(screen.getByText('Tải tập tin (PDF/DOCX)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Bắt đầu nhập liệu ghi chú lâm sàng...')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã định danh bệnh nhân/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phân loại ghi chú/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bắt đầu trích xuất/i })).toBeInTheDocument();
  });

  it('switches to file upload tab when clicked', async () => {
    render(
      <MemoryRouter>
        <EHRUpload />
      </MemoryRouter>
    );

    const fileTabButton = screen.getByText('Tải tập tin (PDF/DOCX)');
    fireEvent.click(fileTabButton);

    // Dropzone elements should now be visible
    expect(screen.getByText('Tải hồ sơ lên')).toBeInTheDocument();
    expect(screen.getByText('Duyệt file')).toBeInTheDocument();
    expect(screen.getByText('Tài liệu sẽ được hiển thị xem trước ở đây')).toBeInTheDocument();
  });

  it('displays error if text submission is empty or too short', async () => {
    render(
      <MemoryRouter>
        <EHRUpload />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Bắt đầu trích xuất/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Mã bệnh nhân phải là số')).toBeInTheDocument();
    
    // Fill patient ID but keep text empty
    const pidInput = screen.getByLabelText(/Mã định danh bệnh nhân/i);
    fireEvent.change(pidInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập văn bản lâm sàng')).toBeInTheDocument();
  });

  it('allows PDF and TXT file uploads and rejects image files', async () => {
    render(
      <MemoryRouter>
        <EHRUpload />
      </MemoryRouter>
    );

    // Switch to file tab
    fireEvent.click(screen.getByText('Tải tập tin (PDF/DOCX)'));

    // Find the file input element (it's hidden but searchable by class or container)
    const fileInput = screen.getByTestId('file-mode').querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // 1. Upload disallowed file (JPEG image)
    const invalidFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText('Chỉ hỗ trợ PDF, Word (.doc, .docx) hoặc Văn bản (.txt)')).toBeInTheDocument();

    // 2. Upload valid file (PDF)
    const validPdfFile = new File(['%PDF-1.4 ... dummy content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [validPdfFile] } });

    // The error should be cleared and file details displayed
    await waitFor(() => {
      expect(screen.queryByText('Chỉ hỗ trợ PDF, Word (.doc, .docx) hoặc Văn bản (.txt)')).not.toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // 3. Upload valid plain text file (.txt)
    const validTxtFile = new File(['symptoms: headache, fever'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [validTxtFile] } });

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });
});
