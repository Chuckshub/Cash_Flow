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
    
    csvData.forEach((row) => {
      // Skip empty rows
      if (!row.Date && !row.date) return;
      
      let date: string;
      let description: string;
      let amount: number;
      
      // Handle Coder Technologies bank format
      if (row.Date || row.date) {
        const rawDate = row.Date || row.date || '';
        description = row.Description || row.description || '';
        const rawAmount = row.Amount || row.amount || '0';
        
        // Parse date from "Aug 7, 2025" format to ISO format
        try {
          const parsedDate = new Date(rawDate);
          date = parsedDate.toISOString().split('T')[0];
        } catch {
          // Fallback for invalid dates
          date = new Date().toISOString().split('T')[0];
        }
        
        // Parse amount - remove $ signs, commas, and handle negative values
        const cleanAmount = rawAmount.toString()
          .replace(/[$,]/g, '')
          .replace(/[()]/g, '') // Remove parentheses if present
          .trim();
        
        // Handle negative amounts that start with -
        if (cleanAmount.startsWith('-')) {
          amount = -parseFloat(cleanAmount.substring(1));
        } else {
          amount = parseFloat(cleanAmount);
        }
        
        // Skip if amount is invalid
        if (isNaN(amount)) return;
        
      } else if (row['0'] && row['1']) {
        // Fallback for generic CSV format
        date = row['0'] || '';
        description = row['1'] || '';
        amount = parseFloat(row['2'] || '0');
        
        try {
          date = new Date(date).toISOString().split('T')[0];
        } catch {
          date = new Date().toISOString().split('T')[0];
        }
      } else {
        return; // Skip invalid rows
      }
      
      // Determine if it's inflow or outflow
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
                <li>Bank export CSV files (Date, Description, Amount)</li>
                <li>Commercial banking formats with transaction types</li>
                <li>Files with currency symbols ($) and commas</li>
                <li>Standard CSV files with headers</li>
              </ul>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}