"use client";

import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem
} from '@heroui/react';
import { Filter, Download, Sparkles } from 'lucide-react';
import { Transaction } from './CSVUpload';

interface WeeklyCashFlow {
  week: string;
  weekStart: string;
  weekEnd: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  transactionCount: number;
  categories: { [key: string]: number };
}

interface CategoryBucket {
  name: string;
  total: number;
  count: number;
  percentage: number;
  transactions: Transaction[];
}

interface CashFlowTableProps {
  transactions: Transaction[];
}

export default function CashFlowTable({ transactions }: CashFlowTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('weekly');

  const { weeklyData, categoryBuckets, summaryStats } = useMemo(() => {
    if (!transactions.length) return { weeklyData: [], categoryBuckets: [], summaryStats: null };

    // Filter transactions by selected category
    const filteredTransactions = selectedCategory === 'all' 
      ? transactions 
      : transactions.filter(t => t.category === selectedCategory);

    // Group transactions by week
    const weeklyGroups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      weeklyGroups[weekKey].push(transaction);
    });

    // Calculate weekly cash flows with categories
    const weeklyFlows: WeeklyCashFlow[] = Object.entries(weeklyGroups)
      .map(([weekStart, weekTransactions]) => {
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        const inflows = weekTransactions
          .filter(t => t.type === 'inflow')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const outflows = weekTransactions
          .filter(t => t.type === 'outflow')
          .reduce((sum, t) => sum + t.amount, 0);

        // Group by categories for this week
        const categories: { [key: string]: number } = {};
        weekTransactions.forEach(t => {
          const category = t.category || 'Uncategorized';
          categories[category] = (categories[category] || 0) + t.amount;
        });
        
        return {
          week: `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          weekStart: startDate.toISOString().split('T')[0],
          weekEnd: endDate.toISOString().split('T')[0],
          inflows,
          outflows,
          netFlow: inflows - outflows,
          transactionCount: weekTransactions.length,
          categories
        };
      })
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    // Create category buckets
    const categoryMap = new Map<string, Transaction[]>();
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(transaction);
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const buckets: CategoryBucket[] = Array.from(categoryMap.entries()).map(([category, categoryTransactions]) => {
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category,
        total,
        count: categoryTransactions.length,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
        transactions: categoryTransactions
      };
    }).sort((a, b) => b.total - a.total);

    // Calculate summary statistics
    const totalInflows = weeklyFlows.reduce((sum, week) => sum + week.inflows, 0);
    const totalOutflows = weeklyFlows.reduce((sum, week) => sum + week.outflows, 0);
    const totalNetFlow = totalInflows - totalOutflows;

    return {
      weeklyData: weeklyFlows,
      categoryBuckets: buckets,
      summaryStats: {
        totalInflows,
        totalOutflows,
        totalNetFlow,
        totalTransactions: transactions.length,
        weeksAnalyzed: weeklyFlows.length,
        categoriesFound: buckets.length
      }
    };
  }, [transactions, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Reimbursements': 'primary',
      'Payroll': 'success', 
      'Vendor Payments': 'warning',
      'Equity or Funding Proceeds': 'secondary',
      'Customer Receipts': 'success',
      'Other / Misc': 'default'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  if (!transactions.length) {
    return (
      <Card className="w-full">
        <CardBody className="text-center py-8">
          <p className="text-default-500">No data to display. Please upload a CSV file.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-green-200">
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium">Total Inflows</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(summaryStats?.totalInflows || 0)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-red-200">
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm text-red-700 font-medium">Total Outflows</p>
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(summaryStats?.totalOutflows || 0)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`bg-white border ${(summaryStats?.totalNetFlow || 0) >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${(summaryStats?.totalNetFlow || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatCurrency(summaryStats?.totalNetFlow || 0)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-blue-200">
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm text-blue-700 font-medium">AI Categories</p>
              <p className="text-2xl font-bold text-blue-800">
                {summaryStats?.categoriesFound || 0}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Categories</option>
              {categoryBuckets.map((bucket) => (
                <option key={bucket.name} value={bucket.name}>
                  {bucket.name} ({bucket.count})
                </option>
              ))}
            </select>
          </div>
          
          {transactions.some(t => t.category) && (
            <Chip color="secondary" variant="flat" startContent={<Sparkles className="h-3 w-3" />}>
              AI Categorized
            </Chip>
          )}
        </div>
        
        <Button
          variant="bordered"
          startContent={<Download className="h-4 w-4" />}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Export Report
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab key="weekly" title="Weekly Analysis">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">Weekly Cash Flow Breakdown</h3>
            </CardHeader>
            <CardBody>
              <Table aria-label="Weekly cash flow table">
                <TableHeader>
                  <TableColumn>WEEK</TableColumn>
                  <TableColumn>INFLOWS</TableColumn>
                  <TableColumn>OUTFLOWS</TableColumn>
                  <TableColumn>NET FLOW</TableColumn>
                  <TableColumn>TRANSACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {weeklyData.map((week, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{week.week}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-700 font-medium">
                          {formatCurrency(week.inflows)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-700 font-medium">
                          {formatCurrency(week.outflows)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={week.netFlow >= 0 ? 'success' : 'danger'}
                          variant="flat"
                          size="sm"
                        >
                          {formatCurrency(week.netFlow)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{week.transactionCount}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="categories" title="Category Buckets">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">AI-Categorized Expenses</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {categoryBuckets.map((bucket, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <Chip 
                          color={getCategoryColor(bucket.name) as 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'}
                          variant="flat"
                          size="sm"
                        >
                          {bucket.name}
                        </Chip>
                        <span className="text-sm text-gray-600">
                          {bucket.count} transactions
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{formatCurrency(bucket.total)}</p>
                        <p className="text-xs text-gray-500">{bucket.percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    
                    {/* Show top transactions in this category */}
                    <div className="mt-3 space-y-2">
                      {bucket.transactions.slice(0, 3).map((transaction, txIndex) => (
                        <div key={txIndex} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 truncate flex-1 mr-4">
                            {transaction.description}
                          </span>
                          <span className={`font-medium ${
                            transaction.type === 'inflow' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {transaction.type === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      ))}
                      {bucket.transactions.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{bucket.transactions.length - 3} more transactions
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}