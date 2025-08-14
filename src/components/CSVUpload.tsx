"use client";

import { useState, useCallback } from 'react';
import { Card, CardBody, Button, Progress } from '@heroui/react';
import { Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category?: string;
  subcategory?: string;
  confidence?: number;
}

interface CSVRow {
  [key: string]: string | undefined;
}

interface CSVUploadProps {
  onDataParsed: (transactions: Transaction[]) => void;
}

export default function CSVUpload({ onDataParsed }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parseCSVData = useCallback((csvData: CSVRow[]) => {
    const transactions: Transaction[] = [];
    
    csvData.forEach((row) => {
      if (!row.Date && !row.date) return;
      
      let date: string;
      let description: string;
      let amount: number;
      
      if (row.Date || row.date) {
        const rawDate = row.Date || row.date || '';
        description = row.Description || row.description || '';
        const rawAmount = row.Amount || row.amount || '0';
        
        try {
          const parsedDate = new Date(rawDate);
          date = parsedDate.toISOString().split('T')[0];
        } catch {
          date = new Date().toISOString().split('T')[0];
        }
        
        const cleanAmount = rawAmount.toString()
          .replace(/[$,]/g, '')
          .replace(/[()]/g, '')
          .trim();
        
        if (cleanAmount.startsWith('-')) {
          amount = -parseFloat(cleanAmount.substring(1));
        } else {
          amount = parseFloat(cleanAmount);
        }
        
        if (isNaN(amount)) return;
      } else {
        return;
      }
      
      const type: 'inflow' | 'outflow' = amount >= 0 ? 'inflow' : 'outflow';
      
      transactions.push({
        date,
        description: description.trim(),
        amount: Math.abs(amount),
        type
      });
    });
    
    return transactions;
  }, []);

  const categorizeWithAI = useCallback(async (transactions: Transaction[]) => {
    console.log('🤖 [DEBUG] Starting AI categorization with', transactions.length, 'transactions');
    setIsCategorizing(true);
    setCurrentStep('Sending data to AI for categorization...');
    setProgress(70);
    
    try {
      console.log('🤖 [DEBUG] Sending request to /api/categorize');
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });
      
      console.log('🤖 [DEBUG] API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 [DEBUG] API error response:', errorText);
        throw new Error(`Failed to categorize transactions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🤖 [DEBUG] Received categorized data:', data);
      setProgress(100);
      setCurrentStep('Categorization complete!');
      
      setTimeout(() => {
        console.log('🤖 [DEBUG] Calling onDataParsed with categorized transactions');
        onDataParsed(data.categorizedTransactions);
        setIsProcessing(false);
        setIsCategorizing(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
      
    } catch (error) {
      console.error('🤖 [DEBUG] Categorization error:', error);
      setCurrentStep('AI categorization failed, using basic categories...');
      
      // Fallback: use basic categorization
      const basicCategorized = transactions.map(t => ({
        ...t,
        category: t.type === 'inflow' ? 'Revenue' : 'Business Expenses',
        confidence: 0.5
      }));
      
      console.log('🤖 [DEBUG] Using fallback categorization:', basicCategorized.length, 'transactions');
      
      setTimeout(() => {
        onDataParsed(basicCategorized);
        setIsProcessing(false);
        setIsCategorizing(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
    }
  }, [onDataParsed]);

  const handleFileUpload = useCallback((file: File) => {
    console.log('📁 [DEBUG] Starting file upload:', file.name, file.size, 'bytes');
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Reading CSV file...');
    
    // Simulate initial progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        console.log('📁 [DEBUG] Progress update:', prev, '-> ', prev + 10);
        if (prev >= 50) {
          console.log('📁 [DEBUG] Reached 50%, stopping progress interval');
          clearInterval(progressInterval);
          return 50;
        }
        return prev + 10;
      });
    }, 200);
    
    console.log('📁 [DEBUG] Starting Papa.parse');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log('📁 [DEBUG] Papa.parse complete, results:', results);
        try {
          setCurrentStep('Parsing transaction data...');
          console.log('📁 [DEBUG] Calling parseCSVData with', results.data.length, 'rows');
          const transactions = parseCSVData(results.data as CSVRow[]);
          console.log('📁 [DEBUG] Parsed', transactions.length, 'valid transactions');
          setProgress(60);
          
          if (transactions.length === 0) {
            console.log('📁 [DEBUG] No transactions found, showing error');
            setError('No valid transactions found in the CSV file.');
            setIsProcessing(false);
            return;
          }
          
          console.log('📁 [DEBUG] About to call categorizeWithAI');
          // Send to OpenAI for categorization
          await categorizeWithAI(transactions);
          
        } catch (error) {
          console.error('📁 [DEBUG] Error in complete handler:', error);
          setError('Error parsing CSV file. Please check the format.');
          setIsProcessing(false);
          setProgress(0);
          setCurrentStep('');
        }
      },
      error: (error) => {
        console.error('📁 [DEBUG] Papa.parse error:', error);
        setError(`Error reading file: ${error.message}`);
        setIsProcessing(false);
        setProgress(0);
        setCurrentStep('');
      }
    });
  }, [parseCSVData, categorizeWithAI]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError('Please upload a CSV file.');
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border border-gray-200 shadow-lg">
      <CardBody className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Financial Data</h2>
          <p className="text-gray-600">AI-powered categorization and analysis</p>
        </div>

        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${
              isProcessing 
                ? 'pointer-events-none opacity-75' 
                : ''
            }
          `}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !isProcessing && document.getElementById('csv-input')?.click()}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Data</h3>
                <p className="text-gray-600 mb-4">{currentStep}</p>
                <Progress 
                  value={progress} 
                  className="max-w-md mx-auto" 
                  color="primary"
                  classNames={{
                    track: "bg-gray-200",
                    indicator: "bg-blue-600"
                  }}
                />
                {isCategorizing && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                    <span className="text-sm text-purple-700 font-medium">AI is categorizing your transactions...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <Upload className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
                </h3>
                <p className="text-gray-600 mb-4">
                  or <span className="text-blue-600 font-medium">click to browse</span>
                </p>
                <Button
                  color="primary"
                  variant="solid"
                  size="lg"
                  startContent={<FileText className="h-5 w-5" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Choose File
                </Button>
              </div>
            </div>
          )}

          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-2xl border-2 border-red-300">
              <div className="text-center space-y-3">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Upload Failed</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <Button
                  color="danger"
                  variant="light"
                  onClick={() => setError(null)}
                  className="text-red-700 hover:text-red-800 font-medium"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Sparkles className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-purple-800">AI Categorization</p>
            <p className="text-xs text-purple-700">Smart expense bucketing</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Bank CSV Support</p>
            <p className="text-xs text-green-700">Multiple formats supported</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Upload className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-blue-800">Instant Processing</p>
            <p className="text-xs text-blue-700">Results in seconds</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}