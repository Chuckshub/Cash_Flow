"use client";

import { useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Upload, BarChart3, TrendingUp } from 'lucide-react';
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
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                Cash Flow Analytics
              </h1>
              <p className="text-default-600 mt-2">
                Analyzing {transactions.length} transactions
              </p>
            </div>
            
            <Button
              color="primary"
              variant="bordered"
              startContent={<Upload className="h-4 w-4" />}
              onClick={() => setTransactions([])}
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
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                Upload Financial Data
              </h1>
              <p className="text-default-600 mt-1">
                Import your CSV file to analyze cash flows
              </p>
            </div>
            
            <Button
              variant="light"
              onClick={() => setShowUpload(false)}
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

  // Landing page with modern design
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl animate-bounce-subtle" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success-200/30 rounded-full blur-3xl animate-bounce-subtle" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                  CashFlow Pro
                </h1>
                <p className="text-sm text-default-500">Smart Financial Analytics</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-success-500 bg-clip-text text-transparent">
                  Transform
                </span>
                <br />
                <span className="text-foreground">Your Cash Flow</span>
              </h2>
              
              <p className="text-lg sm:text-xl text-default-600 leading-relaxed max-w-3xl mx-auto">
                Upload your bank CSV data and get instant, actionable insights with our 
                AI-powered analytics platform. Analyze weekly cash flows and make smarter financial decisions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                color="primary"
                variant="solid"
                startContent={<Upload className="h-5 w-5" />}
                onClick={() => setShowUpload(true)}
                className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Button>
              
              <Button
                size="lg"
                variant="bordered"
                startContent={<TrendingUp className="h-5 w-5" />}
                className="px-8 py-6 text-lg font-semibold border-2 transition-all duration-300"
              >
                View Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {[
                {
                  icon: BarChart3,
                  title: "Smart Analytics",
                  description: "AI-powered insights from your financial data"
                },
                {
                  icon: TrendingUp,
                  title: "Weekly Reports",
                  description: "Comprehensive cash flow analysis by week"
                },
                {
                  icon: Upload,
                  title: "Easy Upload",
                  description: "Drag & drop CSV files for instant processing"
                }
              ].map((feature) => (
                <Card key={feature.title} className="bg-background/60 backdrop-blur-sm border border-divider hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardBody className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-default-600 leading-relaxed">{feature.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="text-center mt-16">
              <p className="text-sm text-default-500 mb-8">Trusted by finance teams worldwide</p>
              <div className="flex justify-center items-center gap-8 opacity-60">
                <div className="text-center">
                  <div className="text-2xl font-bold text-default-400">10K+</div>
                  <div className="text-xs text-default-400">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-default-400">$2B+</div>
                  <div className="text-xs text-default-400">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-default-400">99.9%</div>
                  <div className="text-xs text-default-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}