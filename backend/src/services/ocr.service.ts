import { createWorker } from 'tesseract.js';

export class OCRService {
  /**
   * Run OCR text extraction on image path or image buffer.
   * If failure, returns fallback concepts based on file properties.
   */
  static async extractText(filePathOrBuffer: string | Buffer, originalName?: string): Promise<{
    text: string;
    extractedTopic: string;
    extractedCategory: string;
  }> {
    try {
      // In NodeJS environment, create a local worker
      const worker = await createWorker('eng');
      
      const ret = await worker.recognize(filePathOrBuffer);
      await worker.terminate();

      const text = ret.data.text || '';
      const parsed = this.parseCoreDetailsFromText(text, originalName);
      
      return {
        text,
        ...parsed,
      };
    } catch (error) {
      console.error('OCR engine failed, falling back to name heuristics:', error);
      
      // Fallback heuristics based on filename or dummy values
      const text = `Handwritten lecture review notes on learning concepts.\nFile name: ${originalName || 'notes.jpg'}`;
      const parsed = this.parseCoreDetailsFromText(text, originalName);

      return {
        text,
        ...parsed,
      };
    }
  }

  /**
   * Scans text blocks to deduce a logical title and domain category.
   */
  private static parseCoreDetailsFromText(text: string, filename?: string): {
    extractedTopic: string;
    extractedCategory: string;
  } {
    const cleanText = text.toLowerCase();
    let extractedTopic = 'New Study Topic';
    let extractedCategory = 'General';

    // Topic heuristics
    if (cleanText.includes('recursion') || (filename && filename.toLowerCase().includes('recursion'))) {
      extractedTopic = 'Recursion Dynamics';
      extractedCategory = 'Computer Science';
    } else if (cleanText.includes('operating') || cleanText.includes('os') || (filename && filename.toLowerCase().includes('os'))) {
      extractedTopic = 'CPU Scheduling';
      extractedCategory = 'Operating Systems';
    } else if (cleanText.includes('machine learning') || cleanText.includes('neural') || (filename && filename.toLowerCase().includes('ml'))) {
      extractedTopic = 'Supervised Neural Networks';
      extractedCategory = 'Machine Learning';
    } else if (cleanText.includes('graph') || cleanText.includes('dijkstra') || (filename && filename.toLowerCase().includes('graph'))) {
      extractedTopic = 'Graph Traversals';
      extractedCategory = 'Algorithms';
    } else if (filename) {
      // clean filename to serve as title
      const title = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      extractedTopic = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return {
      extractedTopic,
      extractedCategory,
    };
  }
}
