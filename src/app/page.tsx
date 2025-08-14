"use client";

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Upload, TrendingUp, BarChart3 } from 'lucide-react';
import CSVUpload, { Transaction } from '@/components/CSVUpload';
import CashFlowTable from '@/components/CashFlowTable';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleDataParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
    setShowUpload(false);
  };

  if (transactions.length > 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                Cash Flow Analytics
              </h1>
              <p className="text-default-600 mt-2">
                Showing {transactions.length} transactions
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

  if (showUpload) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30 flex items-center justify-center">
        <div className="w-full max-w-4xl px-4">
          <CSVUpload onDataParsed={handleDataParsed} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl animate-bounce-subtle" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success-200/30 rounded-full blur-3xl animate-bounce-subtle" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-success-500 bg-clip-text text-transparent">
                Transform
              </span>
              <br />
              <span className="text-foreground">Your Cash Flow</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-default-600 max-w-3xl mx-auto leading-relaxed mb-10">
              Upload your bank CSV data and get instant, actionable insights with our 
              AI-powered analytics platform. Make smarter financial decisions with 
              beautiful visualizations and comprehensive reports.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                size="lg"
                color="primary"
                variant="solid"
                startContent={<Upload className="h-5 w-5" />}
                onClick={() => setShowUpload(true)}
                className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Free
              </Button>
              
              <Button
                size="lg"
                variant="bordered"
                className="px-8 py-6 text-lg font-semibold border-2 transition-all duration-300"
              >
                View Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="text-center mb-16">
              <p className="text-sm text-default-500 mb-8">Trusted by finance teams worldwide</p>
              <div className="flex justify-center items-center gap-8 opacity-60">
                <div className="text-2xl font-bold text-default-400">10K+</div>
                <div className="text-2xl font-bold text-default-400">•</div>
                <div className="text-2xl font-bold text-default-400">$2B+</div>
                <div className="text-2xl font-bold text-default-400">•</div>
                <div className="text-2xl font-bold text-default-400">99.9%</div>
              </div>
              <div className="flex justify-center items-center gap-8 mt-2 text-xs text-default-400">
                <span>Users</span>
                <span>•</span>
                <span>Processed</span>
                <span>•</span>
                <span>Uptime</span>
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Smart Analytics",
                description: "AI-powered insights from your financial data"
              },
              {
                icon: BarChart3,
                title: "Weekly Reports",
                description: "Comprehensive cash flow analysis by week"
              },
              {
                icon: Upload,
                title: "Instant Processing",
                description: "Upload CSV and get insights in seconds"
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-background/60 backdrop-blur-sm border border-divider rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-default-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}