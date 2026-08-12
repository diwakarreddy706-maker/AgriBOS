import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Globe, Loader2, FileText } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number | null;
  documentType: 'invoice' | 'receipt';
  documentNumber?: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentType,
  documentNumber = 'Document'
}) => {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      loadPdf(documentId, lang);
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
  }, [isOpen, documentId, lang]);

  const loadPdf = async (id: number, currentLang: 'en' | 'kn') => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = documentType === 'receipt' ? `/receipts/${id}/pdf` : `/invoices/${id}/pdf`;
      const response = await apiClient.get(`${endpoint}?lang=${currentLang}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${documentType.toUpperCase()}-${documentNumber}-${lang}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {documentType === 'receipt' ? 'Payment Receipt Preview' : 'Tax Invoice Preview'}
              </h3>
              <p className="text-xs text-slate-400">{documentNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(l => (l === 'en' ? 'kn' : 'en'))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'English ➔ Kannada (ಕನ್ನಡ)' : 'Kannada ➔ English'}</span>
            </button>

            {/* Print Action */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfBlobUrl || loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 disabled:opacity-50 transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print</span>
            </button>

            {/* Download Action */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pdfBlobUrl || loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-950 p-4 min-h-[500px] flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Generating PDF Document...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-center max-w-md">
              <p className="text-sm font-medium text-red-300">{error}</p>
              <button
                onClick={() => loadPdf(documentId!, lang)}
                className="mt-3 px-4 py-1.5 bg-red-900/60 hover:bg-red-800 text-xs text-red-100 rounded-lg transition"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && pdfBlobUrl && (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full min-h-[600px] rounded-lg border border-slate-800 bg-white"
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
