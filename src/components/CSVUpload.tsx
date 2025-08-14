"use client";

import { useState, useCallback } from 'react';
import { Card, CardBody, Button, Progress, Chip } from '@heroui/react';
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
    setIsCategorizing(true);
    setCurrentStep('Sending data to AI for categorization...');
    setProgress(70);
    
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to categorize transactions');
      }
      
      const data = await response.json();
      setProgress(100);
      setCurrentStep('Categorization complete!');
      
      setTimeout(() => {
        onDataParsed(data.categorizedTransactions);
        setIsProcessing(false);
        setIsCategorizing(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
      
    } catch (error) {
      console.error('Categorization error:', error);
      setCurrentStep('AI categorization failed, using basic categories...');
      
      // Fallback: use basic categorization
      const basicCategorized = transactions.map(t => ({
        ...t,
        category: t.type === 'inflow' ? 'Revenue' : 'Business Expenses',
        confidence: 0.5
      }));
      
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
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Reading CSV file...');
    
    // Simulate initial progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 50) {
          clearInterval(progressInterval);
          return 50;
        }
        return prev + 10;
      });
    }, 200);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          setCurrentStep('Parsing transaction data...');
          const transactions = parseCSVData(results.data as CSVRow[]);
          setProgress(60);
          
          if (transactions.length === 0) {
            setError('No valid transactions found in the CSV file.');
            setIsProcessing(false);
            return;
          }
          
          // Send to OpenAI for categorization
          await categorizeWithAI(transactions);
          
        } catch {
          setError('Error parsing CSV file. Please check the format.');
          setIsProcessing(false);
          setProgress(0);
          setCurrentStep('');
        }
      },
      error: (error) => {
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
    <Card className="w-full max-w-2xl mx-auto shadow-xl border border-divider">
      <CardBody className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Upload Your Financial Data</h2>
          <p className="text-default-600">AI-powered categorization and analysis</p>
        </div>

        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-default-300 hover:border-primary hover:bg-default-50'
            }
            ${isProcessing ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          {isProcessing ? (
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                {isCategorizing ? (
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                ) : (
                  <FileText className="h-10 w-10 text-primary animate-pulse" />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">
                  {isCategorizing ? 'AI Categorizing Transactions...' : 'Processing your file...'}
                </h3>
                <Progress 
                  value={progress} 
                  color="primary" 
                  className="max-w-md mx-auto"
                  showValueLabel
                />
                <p className="text-sm text-default-500">
                  {currentStep}
                </p>
                {isCategorizing && (
                  <Chip color="secondary" variant="flat" startContent={<Sparkles className="h-3 w-3" />}>
                    AI Processing
                  </Chip>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">
                  {isDragging ? 'Drop your file here' : 'Choose your CSV file'}
                </h3>
                <p className="text-default-600">
                  Upload bank data for AI-powered categorization and analysis
                </p>
                <Button
                  color="primary"
                  variant="solid"
                  size="lg"
                  startContent={<Upload className="h-5 w-5" />}
                  onClick={() => document.getElementById('csv-input')?.click()}
                >
                  Browse Files
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
            <div className="absolute inset-0 flex items-center justify-center bg-danger-50/90 rounded-2xl border-2 border-danger">
              <div className="text-center space-y-3">
                <AlertCircle className="h-12 w-12 text-danger mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-danger">Upload Failed</h3>
                  <p className="text-sm text-danger-600">{error}</p>
                </div>
                <Button
                  color="danger"
                  variant="light"
                  onClick={() => setError(null)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-default-50 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">AI Categorization</p>
            <p className="text-xs text-default-500">Smart expense bucketing</p>
          </div>
          <div className="text-center p-4 bg-default-50 rounded-lg">
            <FileText className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">Bank CSV Support</p>
            <p className="text-xs text-default-500">Multiple formats supported</p>
          </div>
          <div className="text-center p-4 bg-default-50 rounded-lg">
            <Upload className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-sm font-medium">Instant Processing</p>
            <p className="text-xs text-default-500">Results in seconds</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}