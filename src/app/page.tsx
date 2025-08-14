"use client";

import { useState } from 'react';
import CSVUpload, { Transaction } from '@/components/CSVUpload';
import CashFlowTable from '@/components/CashFlowTable';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleDataParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cash Flow Tracker
          </h1>
          <p className="text-gray-600">
            Upload your bank CSV data to analyze weekly cash flows
          </p>
        </div>
        
        {transactions.length === 0 ? (
          <CSVUpload onDataParsed={handleDataParsed} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                Showing {transactions.length} transactions
              </h2>
              <button
                onClick={() => setTransactions([])}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Upload New File
              </button>
            </div>
            <CashFlowTable transactions={transactions} />
          </div>
        )}
      </div>
    </main>
  );
}