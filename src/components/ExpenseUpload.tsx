import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../types';

interface ExpenseUploadProps {
  onExpensesExtracted: (expenses: Partial<Expense>[]) => void;
}

function resolveGeminiApiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
}

function parseExtractionResponse(text: string): { expenses: Partial<Expense>[] } {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  return {
    expenses: Array.isArray(parsed?.expenses) ? parsed.expenses : [],
  };
}

export default function ExpenseUpload({ onExpensesExtracted }: ExpenseUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const apiKey = resolveGeminiApiKey();
      if (!apiKey) {
        throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment.');
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL || import.meta.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: `You are a professional financial data extractor specialized in multi-page bank statements and receipts.
Your task is to scan the PROVIDED DOCUMENT EXHAUSTIVELY from the VERY FIRST PAGE to the VERY LAST PAGE, line by line.

Extract EVERY SINGLE financial transaction (expenses, debits, payments, withdrawals, AND incoming money, credits, deposits, or received payments).
Do NOT skip any pages. Do NOT stop until you reach the end of the document.

CRITICAL INSTRUCTIONS:
1. EXHAUSTIVE SCAN: Look at every single row in every table across all pages.
2. ALL TRANSACTIONS: Include both outgoing (money transfer) and incoming (money received) money.
3. RECEIVED TAGGING: For every incoming transaction (money received), you MUST add the tag '#money-received'.
4. CURRENCY: Assume the currency is Indian Rupees (₹) unless clearly stated otherwise.
5. FORMAT: Return a JSON object with an 'expenses' key containing an array of objects.
6. SCHEMA: Each object must have:
   - amount: number (absolute value of the transaction)
   - merchant: string (clean name of the store, service, or sender)
   - date: string (YYYY-MM-DD)
   - time: string (HH:MM AM/PM if available, otherwise empty string)
   - category: string (One of: Food & Dining, Transportation, Shopping, Entertainment, Utilities, Health, Travel, Education, Money Transfer, Money Received, Other)
   - description: string (brief detail from the statement)
   - tags: array of strings (EVERY tag MUST start with the '#' symbol, e.g., '#grocery', '#money-received', '#salary')
   - paymentMethod: string (e.g., 'Credit Card', 'Debit Card', 'UPI', 'Cash', 'Net Banking')
   - status: string (One of: 'pending', 'completed', 'cancelled')
6. EDGE CASES: 
   - If a transaction spans two lines, combine them.
   - If the merchant name is cryptic (e.g., "POS 123456"), try to infer a cleaner name or use the description.
   - If no expenses are found, return {"expenses": []}.
7. THINK STEP BY STEP: First, identify the structure of the tables on each page. Then, iterate through every row to find debits.` },
              { inlineData: { data: base64Data, mimeType: file.type } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (text) {
        const result = parseExtractionResponse(text);
        const extractedExpenses = result.expenses;
        onExpensesExtracted(extractedExpenses);
        setPreview(null);
      } else {
        throw new Error('AI returned an empty response.');
      }
    } catch (err: unknown) {
      console.error('AI Extraction Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to extract data. Please try again or enter manually.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#eef1ff]">Upload Receipt</h3>
          <p className="text-sm text-[#b8b9ea]">Upload an image or PDF to extract expense details automatically.</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-[#7b5cff] bg-[#1e1a55]' : 'border-[#3f3a90] bg-[#181543] hover:border-[#6d65d7]'}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="animate-spin text-[#b9b7ff]" size={48} />
              <p className="text-sm font-bold text-[#eef1ff]">AI is scanning all pages...</p>
              <p className="text-xs text-[#aeb1ed] text-center max-w-[200px]">This may take a bit longer for multi-page statements</p>
            </motion.div>
          ) : preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#4a43a8]">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={32} />
                </div>
              </div>
              <p className="text-sm font-bold text-[#eef1ff]">File uploaded successfully</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#23205e] flex items-center justify-center text-[#b8b9ea]">
                <Upload size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#eef1ff]">Drop your receipt here, or click to browse</p>
                <p className="text-xs text-[#aeb1ed] mt-1">Supports JPG, PNG, and PDF</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-[#ff9ecb] text-xs font-medium justify-center">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureItem icon={FileText} title="PDF Support" desc="Extract from digital invoices" />
        <FeatureItem icon={ImageIcon} title="Image Scan" desc="Snap a photo of your receipt" />
        <FeatureItem icon={CheckCircle2} title="Auto-Tagging" desc="AI categorizes your spending" />
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#1a174c]/90 border border-[#3f3a90]">
      <div className="w-8 h-8 rounded-lg bg-[#282367] flex items-center justify-center text-[#eef1ff] shadow-sm">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-bold text-[#eef1ff]">{title}</p>
        <p className="text-[10px] text-[#b8b9ea] leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
