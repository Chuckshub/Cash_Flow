"use client";

import { useState } from 'react';
import { Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Upload, LogOut } from 'lucide-react';
import CSVUpload, { Transaction } from '@/components/CSVUpload';
import CashFlowTable from '@/components/CashFlowTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const { user, logout } = useAuth();

  const handleDataParsed = (parsedTransactions: Transaction[]) => {
    setTransactions(parsedTransactions);
    setShowUpload(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (transactions.length > 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header with User Profile */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                Cash Flow Analytics
              </h1>
              <p className="text-default-600 mt-2">
                Welcome back, {user?.displayName || user?.email}
              </p>
              <p className="text-default-500 text-sm">
                Showing {transactions.length} transactions
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                color="primary"
                variant="bordered"
                startContent={<Upload className="h-4 w-4" />}
                onClick={() => setTransactions([])}
              >
                Upload New File
              </Button>
              
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform"
                    color="primary"
                    name={user?.displayName || user?.email || 'User'}
                    size="sm"
                    src={user?.photoURL || undefined}
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold">{user?.email}</p>
                  </DropdownItem>
                  <DropdownItem 
                    key="logout" 
                    color="danger" 
                    startContent={<LogOut className="h-4 w-4" />}
                    onClick={handleLogout}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          
          <CashFlowTable transactions={transactions} />
        </div>
      </main>
    );
  }

  if (showUpload) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                Upload Financial Data
              </h1>
              <p className="text-default-600 mt-1">
                Welcome, {user?.displayName || user?.email}
              </p>
            </div>
            
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={user?.displayName || user?.email || 'User'}
                  size="sm"
                  src={user?.photoURL || undefined}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.email}</p>
                </DropdownItem>
                <DropdownItem 
                  key="logout" 
                  color="danger" 
                  startContent={<LogOut className="h-4 w-4" />}
                  onClick={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        
        <div className="flex items-center justify-center px-4">
          <CSVUpload onDataParsed={handleDataParsed} />
        </div>
      </main>
    );
  }

  // Welcome screen for authenticated users
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                CashFlow Pro
              </h1>
              <p className="text-default-600 mt-1">
                Welcome, {user?.displayName || user?.email}
              </p>
            </div>
            
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={user?.displayName || user?.email || 'User'}
                  size="sm"
                  src={user?.photoURL || undefined}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.email}</p>
                </DropdownItem>
                <DropdownItem 
                  key="logout" 
                  color="danger" 
                  startContent={<LogOut className="h-4 w-4" />}
                  onClick={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        
        {/* Welcome Content */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-success-500 bg-clip-text text-transparent">
                  Ready to Analyze
                </span>
                <br />
                <span className="text-foreground">Your Cash Flow?</span>
              </h2>
              
              <p className="text-lg text-default-600 leading-relaxed mb-8">
                Upload your bank CSV data to get started with powerful financial insights and analytics.
              </p>
            </div>
            
            <Button
              size="lg"
              color="primary"
              variant="solid"
              startContent={<Upload className="h-5 w-5" />}
              onClick={() => setShowUpload(true)}
              className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Upload Your Data
            </Button>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { title: "Secure Processing", desc: "Your data stays private" },
                { title: "Instant Analysis", desc: "Results in seconds" },
                { title: "Smart Insights", desc: "AI-powered analytics" }
              ].map((feature, index) => (
                <div key={index} className="bg-background/60 backdrop-blur-sm border border-divider rounded-xl p-6 text-center">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-default-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}