"use client";

import { useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Upload, BarChart3, TrendingUp, Zap, Target, DollarSign } from 'lucide-react';
import CSVUpload, { Transaction } from '@/components/CSVUpload';
import CashFlowTable from '@/components/CashFlowTable';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleDataParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
    setShowUpload(false);
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

  // Landing page with modern white design
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">
                CashFlow Pro
              </h1>
              <p className="text-gray-600 font-medium">Smart Financial Analytics</p>
            </div>
          </div>
          
          {/* Main Headline */}
          <div className="space-y-6 mb-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Transform Your
              <span className="block text-blue-600">Cash Flow Management</span>
            </h2>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Upload your bank CSV data and get instant, actionable insights with our 
              AI-powered analytics platform. Predict, plan, and optimize your cash flow with confidence.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              color="primary"
              variant="solid"
              startContent={<Upload className="h-6 w-6" />}
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Get Started Free
            </Button>
            
            <Button
              size="lg"
              variant="bordered"
              startContent={<TrendingUp className="h-6 w-6" />}
              className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-200"
            >
              View Demo
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Zap,
                title: "AI-Powered Insights",
                description: "Smart categorization and predictive analytics for better decision making",
                color: "bg-yellow-100 text-yellow-600"
              },
              {
                icon: Target,
                title: "13-Week Forecasting",
                description: "Rolling cash flow predictions with actionable recommendations",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: DollarSign,
                title: "Real-Time Tracking",
                description: "Monitor cash position and identify opportunities instantly",
                color: "bg-blue-100 text-blue-600"
              }
            ].map((feature) => (
              <Card key={feature.title} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                <CardBody className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} rounded-2xl mb-6`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-gray-500 mb-8 font-medium">Trusted by finance teams worldwide</p>
            <div className="flex justify-center items-center gap-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600 font-medium">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">$2B+</div>
                <div className="text-sm text-gray-600 font-medium">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600 font-medium">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}