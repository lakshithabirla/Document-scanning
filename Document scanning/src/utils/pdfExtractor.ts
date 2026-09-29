import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for browser environment
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  // worker fallback
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export async function extractPdfText(file: File): Promise<ExtractedPage[]> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const pages: ExtractedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const rawText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      const cleanText = rawText
        .replace(/-\s*\n\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText) {
        pages.push({
          pageNumber: i,
          text: cleanText,
        });
      }
    }

    if (pages.length > 0) {
      return pages;
    }
  } catch (err) {
    console.warn('PDF.js parsing failed, attempting fallback text extraction...', err);
  }

  // Fallback: extract ASCII / UTF-8 text streams from raw PDF bytes
  return extractFallbackTextFromPdf(arrayBuffer);
}

function extractFallbackTextFromPdf(buffer: ArrayBuffer): ExtractedPage[] {
  const bytes = new Uint8Array(buffer);
  let text = '';
  // Convert printable ASCII characters
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      text += String.fromCharCode(byte);
    }
  }

  // Extract text inside Tj and TJ PDF operators
  const matches = text.match(/\((.*?)\)\s*Tj/g) || [];
  const extractedPieces: string[] = [];

  for (const m of matches) {
    const inner = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').trim();
    if (inner.length > 2) {
      extractedPieces.push(inner);
    }
  }

  const combined = extractedPieces.join(' ').replace(/\s+/g, ' ').trim();
  if (combined) {
    return [{ pageNumber: 1, text: combined }];
  }

  throw new Error('No readable text found in this PDF. It might be scanned or image-only.');
}
