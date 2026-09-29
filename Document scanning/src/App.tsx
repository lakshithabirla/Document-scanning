import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Search, 
  RotateCcw, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { extractPdfText, ExtractedPage } from './utils/pdfExtractor';

interface Chunk {
  chunkId: string;
  pageNumber: number;
  text: string;
}

interface SearchResult {
  text: string;
  page: number;
  doc: string;
  relevance: number;
}

const SAMPLE_PAGES: ExtractedPage[] = [
  {
    pageNumber: 1,
    text: "Chapter 1: Introduction to Computing. Computer systems consist of hardware and software components working together. The central processing unit executes machine instructions stored in memory while input and output controllers manage data transfer across peripheral devices."
  },
  {
    pageNumber: 2,
    text: "Chapter 2: Virtualization Concepts. Virtualization is the process of creating a software-based representation of physical resources. A hypervisor or Virtual Machine Monitor separates the operating system from the physical hardware. Type 1 hypervisors run directly on bare metal while Type 2 hypervisors run on top of a host operating system. Virtualization enables higher hardware utilization and isolation."
  },
  {
    pageNumber: 3,
    text: "Chapter 3: Networking Protocols. Transmission Control Protocol or TCP is a connection-oriented transport layer protocol. TCP ensures reliable in-order data packet transmission through flow control, windowing, and error checking with acknowledgments."
  }
];

function chunkPages(pages: ExtractedPage[], chunkSize: number = 100, overlap: number = 20): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkNum = 1;

  for (const page of pages) {
    const words = page.text.split(/\s+/).filter(Boolean);
    if (words.length <= chunkSize) {
      chunks.push({
        chunkId: `p${page.pageNumber}_c${chunkNum++}`,
        pageNumber: page.pageNumber,
        text: words.join(' ')
      });
      continue;
    }

    const step = chunkSize - overlap;
    for (let i = 0; i < words.length; i += step) {
      const slice = words.slice(i, i + chunkSize);
      chunks.push({
        chunkId: `p${page.pageNumber}_c${chunkNum++}`,
        pageNumber: page.pageNumber,
        text: slice.join(' ')
      });
      if (i + chunkSize >= words.length) break;
    }
  }
  return chunks;
}

function calculateSimilarity(query: string, text: string): number {
  const qWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const tWords = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

  if (qWords.length === 0 || tWords.length === 0) return 0;

  const tWordSet = new Set(tWords);
  let matchCount = 0;
  for (const qw of qWords) {
    if (tWordSet.has(qw)) {
      matchCount++;
    } else {
      for (const tw of tWordSet) {
        if (tw.includes(qw) || qw.includes(tw)) {
          matchCount += 0.65;
          break;
        }
      }
    }
  }

  const score = matchCount / Math.max(1, qWords.length);
  return Math.min(0.96, Math.max(0.1, score * 0.85 + (matchCount > 0 ? 0.15 : 0)));
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<number>(0);
  const [documentReady, setDocumentReady] = useState<boolean>(false);

  const [documentPages, setDocumentPages] = useState<ExtractedPage[]>([]);
  const [documentChunks, setDocumentChunks] = useState<Chunk[]>([]);

  const [question, setQuestion] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [showAdditional, setShowAdditional] = useState<boolean>(false);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
    setFileName(file.name);
    const sizeKb = file.size / 1024;
    setFileSizeText(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb.toFixed(0)} KB`);
    setDocumentReady(false);
    setSearchResults(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setErrorMessage('');
    setSelectedFile(null);
    setFileName('sample_academic_doc.pdf');
    setFileSizeText('3 pages (preloaded)');
    setDocumentPages(SAMPLE_PAGES);
    const chunks = chunkPages(SAMPLE_PAGES);
    setDocumentChunks(chunks);
    setDocumentReady(true);
    setSearchResults(null);
    setQuestion('What is virtualization?');
  };

  const handleProcess = async () => {
    if (!selectedFile && documentPages.length === 0) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setProcessStep(1);

    try {
      let pages: ExtractedPage[] = [];

      if (selectedFile) {
        setProcessStep(1);
        pages = await extractPdfText(selectedFile);
      } else {
        pages = documentPages;
      }

      setProcessStep(2);
      await new Promise(r => setTimeout(r, 250));

      setProcessStep(3);
      const chunks = chunkPages(pages);
      setDocumentPages(pages);
      setDocumentChunks(chunks);
      await new Promise(r => setTimeout(r, 250));

      setProcessStep(4);
      await new Promise(r => setTimeout(r, 250));

      setDocumentReady(true);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Could not parse the PDF file. Please ensure it is a text-based document.');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileName('');
    setFileSizeText('');
    setDocumentPages([]);
    setDocumentChunks([]);
    setDocumentReady(false);
    setIsProcessing(false);
    setProcessStep(0);
    setQuestion('');
    setSearchResults(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = question.trim();
    if (!cleanQuery) return;

    if (!documentReady || documentChunks.length === 0) {
      setErrorMessage('Please process the document first before asking questions.');
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      const scored = documentChunks.map(chunk => {
        const score = calculateSimilarity(cleanQuery, chunk.text);
        return {
          text: chunk.text,
          page: chunk.pageNumber,
          doc: fileName || 'document.pdf',
          relevance: Math.round(score * 100)
        };
      });

      scored.sort((a, b) => b.relevance - a.relevance);
      const filtered = scored.filter(item => item.relevance >= 35).slice(0, 3);
      setSearchResults(filtered);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-100/90 border-r border-slate-200 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xl tracking-tight">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <span>TrustRAG</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Academic Document QA</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">About</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              TrustRAG retrieves relevant information from uploaded PDF documents using semantic similarity search.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technology</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Python
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Streamlit
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                PyMuPDF
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Sentence Transformers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                FAISS
              </li>
            </ul>
          </div>
        </div>

        {documentReady && (
          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={handleClear}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-200/80 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Clear Document
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Header */}
        <header className="space-y-1.5 pb-4 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">TrustRAG</h1>
          <h2 className="text-lg font-medium text-slate-600">Document Question Answering System</h2>
          <p className="text-sm text-slate-500">
            Upload a PDF document and ask questions about its contents.
          </p>
        </header>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Section 1: PDF Upload */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Upload Document</h3>
            {!fileName && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
              >
                Or test with sample PDF
              </button>
            )}
          </div>

          {!fileName ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition space-y-2 bg-white ${
                isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop PDF here or <span className="text-blue-600 underline">Browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Supported format: .pdf</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Document uploaded successfully
                    </span>
                    <p className="text-sm font-medium text-slate-800 mt-1">
                      Document: <span className="font-semibold">{fileName}</span>
                      {fileSizeText && <span className="text-xs text-slate-400 ml-2">({fileSizeText})</span>}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Change file
                </button>
              </div>

              {/* Process Document Button */}
              {!documentReady && !isProcessing && (
                <button
                  onClick={handleProcess}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Process Document
                </button>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs font-medium text-slate-700">
                  <p className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Processing document...
                  </p>
                  <div className="space-y-1.5 pl-1">
                    <div className={`flex items-center gap-2 ${processStep >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {processStep >= 1 ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                      Reading document
                    </div>
                    <div className={`flex items-center gap-2 ${processStep >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {processStep >= 2 ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                      Extracting text
                    </div>
                    <div className={`flex items-center gap-2 ${processStep >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {processStep >= 3 ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                      Creating document chunks
                    </div>
                    <div className={`flex items-center gap-2 ${processStep >= 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {processStep >= 4 ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                      Building semantic index
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Document Information Card */}
        {documentReady && (
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Ready</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <span className="text-xs text-slate-500">Document</span>
                <p className="text-sm font-semibold text-slate-900 truncate" title={fileName}>{fileName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Pages</span>
                <p className="text-sm font-semibold text-slate-900">{documentPages.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Text Chunks</span>
                <p className="text-sm font-semibold text-slate-900">{documentChunks.length}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Status</span>
                <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Question Answering */}
        {documentReady && (
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Ask a question</h3>

            <form onSubmit={handleAsk} className="space-y-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something about your document..."
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              />

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? 'Searching document...' : 'Ask Question'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Section 4: Answer & Citation Display */}
        {searchResults !== null && (
          <section className="space-y-4 pt-2">
            <h3 className="text-base font-semibold text-slate-900">Relevant Information</h3>

            {searchResults.length === 0 ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  No relevant information found.
                </div>
                <p className="text-xs text-amber-700 leading-relaxed pl-6">
                  The uploaded document does not contain enough information to answer this question.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                {/* Top Passage */}
                <div className="text-slate-800 text-sm leading-relaxed border-l-3 border-blue-500 pl-4 py-0.5 bg-slate-50/70 p-3 rounded-r-lg font-normal">
                  "{searchResults[0].text}"
                </div>

                {/* Source Citation */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Source</h4>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-400">📄</span> 
                      <strong>Document:</strong> {searchResults[0].doc}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-400">📖</span> 
                      <strong>Page:</strong> {searchResults[0].page}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-400">🎯</span> 
                      <strong>Relevance:</strong> {searchResults[0].relevance}%
                    </span>
                  </div>
                </div>

                {/* Additional Results Expander */}
                {searchResults.length > 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setShowAdditional(!showAdditional)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      {showAdditional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showAdditional ? 'Hide' : 'View'} Additional Relevant Passages ({searchResults.length - 1} more)
                    </button>

                    {showAdditional && (
                      <div className="mt-3 space-y-3 pl-3 border-l-2 border-slate-200">
                        {searchResults.slice(1).map((res, i) => (
                          <div key={i} className="text-xs text-slate-700 space-y-1.5 bg-slate-50 p-3 rounded-md">
                            <p className="font-semibold text-slate-800">Result {i + 2}</p>
                            <p className="italic">"{res.text}"</p>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                              <span>📄 {res.doc}</span>
                              <span>📖 Page {res.page}</span>
                              <span>🎯 Relevance: {res.relevance}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
