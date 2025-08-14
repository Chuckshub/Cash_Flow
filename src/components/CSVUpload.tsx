"use client";

import { useState, useCallback } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import Papa from 'papaparse';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category?: string;
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
  const [error, setError] = useState<string | null>(null);

  const parseCSVData = useCallback((csvData: CSVRow[]) => {
    const transactions: Transaction[] = [];
    
    csvData.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      
      // Try to detect common CSV formats
      let date: string;
      let description: string;
      let amount: number;
      
      // Common bank CSV formats
      if (row.Date || row.date) {
        date = row.Date || row.date || '';
        description = row.Description || row.description || row.Memo || row.memo || '';
        amount = parseFloat(row.Amount || row.amount || row.Debit || row.debit || row.Credit || row.credit || '0');
      } else if (row['0'] && row['1']) {
        // Assume first column is date, second is description, third is amount
        date = row['0'] || '';
        description = row['1'] || '';
        amount = parseFloat(row['2'] || '0');
      } else {
        return; // Skip invalid rows
      }
      
      // Determine if it's inflow or outflow
      const type: 'inflow' | 'outflow' = amount >= 0 ? 'inflow' : 'outflow';
      
      transactions.push({
        date: new Date(date).toISOString().split('T')[0], // Normalize date format
        description: description.trim(),
        amount: Math.abs(amount),
        type
      });
    });
    
    return transactions;
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = parseCSVData(results.data as CSVRow[]);
          onDataParsed(transactions);
          setIsProcessing(false);
        } catch {
          setError('Error parsing CSV file. Please check the format.');
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setError(`Error reading file: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [parseCSVData, onDataParsed]);

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardBody className="p-8">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="space-y-4">
            <div className="text-6xl">📊</div>
            <h3 className="text-xl font-semibold">Upload Bank CSV Data</h3>
            <p className="text-gray-600">
              Drag and drop your bank CSV file here, or click to select
            </p>
            
            <div className="space-y-2">
              <Button
                color="primary"
                size="lg"
                isLoading={isProcessing}
                onClick={() => document.getElementById('csv-input')?.click()}
              >
                {isProcessing ? 'Processing...' : 'Select CSV File'}
              </Button>
              
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-4">
              <p>Supported formats:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Date, Description, Amount columns</li>
                <li>Standard bank export formats</li>
                <li>CSV files with headers</li>
              </ul>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}