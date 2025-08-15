"use client";

import { useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Upload, BarChart3, TrendingUp, Zap, Target } from 'lucide-react';
import CSVUpload, { Transaction } from '@/components/CSVUpload';
import CashFlowTable from '@/components/CashFlowTable';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleDataParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
    setShowUpload(false);
  };

  const loadSampleData = () => {
    const sampleTransactions: Transaction[] = [
      { date: '2024-01-01', description: 'Salary Deposit', amount: 3500, type: 'inflow', category: 'Salary' },
      { date: '2024-01-02', description: 'Grocery Store', amount: 125.50, type: 'outflow', category: 'Food & Dining' },
      { date: '2024-01-03', description: 'Gas Station', amount: 45, type: 'outflow', category: 'Transportation' },
      { date: '2024-01-05', description: 'Freelance Payment', amount: 800, type: 'inflow', category: 'Freelance' },
      { date: '2024-01-07', description: 'Rent Payment', amount: 1200, type: 'outflow', category: 'Housing' },
      { date: '2024-01-08', description: 'Coffee Shop', amount: 5.50, type: 'outflow', category: 'Food & Dining' },
      { date: '2024-01-10', description: 'Investment Dividend', amount: 150, type: 'inflow', category: 'Investment' },
      { date: '2024-01-12', description: 'Utility Bill', amount: 85, type: 'outflow', category: 'Utilities' },
      { date: '2024-01-15', description: 'Salary Deposit', amount: 3500, type: 'inflow', category: 'Salary' },
      { date: '2024-01-16', description: 'Restaurant', amount: 65, type: 'outflow', category: 'Food & Dining' },
      { date: '2024-01-18', description: 'Online Purchase', amount: 89.99, type: 'outflow', category: 'Shopping' },
      { date: '2024-01-20', description: 'Side Gig Payment', amount: 300, type: 'inflow', category: 'Freelance' },
      { date: '2024-01-22', description: 'Insurance', amount: 200, type: 'outflow', category: 'Insurance' },
      { date: '2024-01-25', description: 'Grocery Store', amount: 110, type: 'outflow', category: 'Food & Dining' },
      { date: '2024-01-28', description: 'Bonus Payment', amount: 1000, type: 'inflow', category: 'Salary' },
      { date: '2024-01-29', description: 'Salary Deposit', amount: 3500, type: 'inflow', category: 'Salary' },
      { date: '2024-01-30', description: 'Phone Bill', amount: 75, type: 'outflow', category: 'Utilities' },
      { date: '2024-02-01', description: 'Rent Payment', amount: 1200, type: 'outflow', category: 'Housing' },
      { date: '2024-02-03', description: 'Grocery Store', amount: 95, type: 'outflow', category: 'Food & Dining' },
      { date: '2024-02-05', description: 'Freelance Payment', amount: 600, type: 'inflow', category: 'Freelance' },
    ];
    setTransactions(sampleTransactions);
  };

  // Show cash flow dashboard if we have data
  if (transactions.length > 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Cash Flow Analytics
              </h1>
              <p className="text-gray-600 text-lg">
                Analyzing {transactions.length} transactions
              </p>
            </div>
            
            <Button
              color="primary"
              variant="solid"
              size="lg"
              startContent={<Upload className="h-5 w-5" />}
              onClick={() => setTransactions([])}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Upload New File
            </Button>
          </div>
          
          <CashFlowTable transactions={transactions} />
        </div>
      </main>
    );
  }

  // Show upload interface
  if (showUpload) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Financial Data
              </h1>
              <p className="text-gray-600 text-lg">
                Import your CSV file to analyze cash flows
              </p>
            </div>
            
            <Button
              variant="light"
              size="lg"
              onClick={() => setShowUpload(false)}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Back
            </Button>
          </div>
          
          <div className="flex items-center justify-center">
            <CSVUpload onDataParsed={handleDataParsed} />
          </div>
        </div>
      </main>
    );
  }

  // Landing page with internal tool design
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Cash Flow Management System
                </h1>
                <p className="text-sm text-gray-600">Internal Financial Analytics Tool</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Version 1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome to Cash Flow Analytics
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Upload your financial data to generate 13-week rolling forecasts, analyze cash flow patterns, 
                and track your organization&apos;s financial health.
              </p>
              
              <Button
                size="lg"
                color="primary"
                variant="solid"
                startContent={<Upload className="h-5 w-5" />}
                onClick={() => setShowUpload(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg mr-4"
              >
                Upload Financial Data
              </Button>
              
              <Button
                size="lg"
                color="secondary"
                variant="bordered"
                onClick={loadSampleData}
                className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 font-medium px-8 py-3 rounded-lg"
              >
                Load Sample Data
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-gray-200">
              <CardBody className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">13-Week Forecasting</h3>
                <p className="text-gray-600 text-sm">
                  Rolling cash flow predictions with scenario planning capabilities
                </p>
              </CardBody>
            </Card>
            
            <Card className="bg-white border border-gray-200">
              <CardBody className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cash Flow Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Detailed breakdown of inflows, outflows, and net cash position
                </p>
              </CardBody>
            </Card>
            
            <Card className="bg-white border border-gray-200">
              <CardBody className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Categorization</h3>
                <p className="text-gray-600 text-sm">
                  Automatic transaction categorization for better insights
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardBody className="p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Getting Started</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">1</div>
                  <div>
                    <p className="font-medium">Prepare your CSV file</p>
                    <p className="text-blue-700">Ensure your file contains columns for Date, Description, Amount, and Type (inflow/outflow)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">2</div>
                  <div>
                    <p className="font-medium">Upload and review</p>
                    <p className="text-blue-700">Upload your file and review the automatically categorized transactions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">3</div>
                  <div>
                    <p className="font-medium">Analyze and forecast</p>
                    <p className="text-blue-700">View your 13-week rolling forecast and add predictions for future periods</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}