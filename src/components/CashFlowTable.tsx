"use client";

import { useMemo } from 'react';
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
  Chip
} from '@heroui/react';
import { Transaction } from './CSVUpload';

interface WeeklyCashFlow {
  week: string;
  weekStart: string;
  weekEnd: string;
  inflows: number;
  outflows: number;
  netFlow: number;
  transactionCount: number;
}

interface CashFlowTableProps {
  transactions: Transaction[];
}

export default function CashFlowTable({ transactions }: CashFlowTableProps) {
  const weeklyData = useMemo(() => {
    if (!transactions.length) return [];

    // Group transactions by week
    const weeklyGroups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      // Get the start of the week (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = [];
      }
      weeklyGroups[weekKey].push(transaction);
    });

    // Calculate weekly cash flows
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
        
        return {
          week: `Week of ${startDate.toLocaleDateString()}`,
          weekStart: startDate.toISOString().split('T')[0],
          weekEnd: endDate.toISOString().split('T')[0],
          inflows,
          outflows,
          netFlow: inflows - outflows,
          transactionCount: weekTransactions.length
        };
      })
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    return weeklyFlows;
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getNetFlowColor = (netFlow: number) => {
    if (netFlow > 0) return 'success';
    if (netFlow < 0) return 'danger';
    return 'default';
  };

  const totalInflows = weeklyData.reduce((sum, week) => sum + week.inflows, 0);
  const totalOutflows = weeklyData.reduce((sum, week) => sum + week.outflows, 0);
  const totalNetFlow = totalInflows - totalOutflows;

  if (!transactions.length) {
    return (
      <Card className="w-full">
        <CardBody className="text-center py-8">
          <p className="text-gray-500">No data to display. Please upload a CSV file.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600">Total Inflows</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalInflows)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600">Total Outflows</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutflows)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-gray-600">Net Cash Flow</p>
            <p className={`text-2xl font-bold ${
              totalNetFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalNetFlow)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Weekly Cash Flow Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Weekly Cash Flow Analysis</h2>
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
                      <p className="font-medium">{week.week}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(week.inflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">
                      {formatCurrency(week.outflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getNetFlowColor(week.netFlow)}
                      variant="flat"
                      size="sm"
                    >
                      {formatCurrency(week.netFlow)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{week.transactionCount}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}