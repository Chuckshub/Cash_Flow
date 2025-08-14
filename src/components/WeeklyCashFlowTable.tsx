"use client";

import { useState, useMemo } from 'react';
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
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea
} from '@heroui/react';
import { Plus, Edit, TrendingUp, TrendingDown, Calendar, DollarSign, Target, AlertCircle } from 'lucide-react';
import { Transaction } from './CSVUpload';

interface WeeklyCashFlowTableProps {
  transactions: Transaction[];
  initialBalance?: number;
}

// Simple prediction structure
interface Prediction {
  weekIndex: number; // 0-12 for the 13 weeks
  inflowAmount: number;
  outflowAmount: number;
  description: string;
}

export default function WeeklyCashFlowTable({ transactions, initialBalance = 0 }: WeeklyCashFlowTableProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [editingWeekIndex, setEditingWeekIndex] = useState<number | null>(null);
  const [inflowInput, setInflowInput] = useState('');
  const [outflowInput, setOutflowInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get current week start (Sunday)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Generate 13 weeks of data
  const weeklyData = useMemo(() => {
    const currentWeekStart = getCurrentWeekStart();
    const weeks = [];
    
    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Find transactions for this week
      const weekTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      });
      
      // Calculate actual flows
      const actualInflows = weekTransactions
        .filter(t => t.type === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const actualOutflows = weekTransactions
        .filter(t => t.type === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Get prediction for this week
      const prediction = predictions.find(p => p.weekIndex === i);
      const predictedInflows = prediction?.inflowAmount || 0;
      const predictedOutflows = prediction?.outflowAmount || 0;
      
      // Calculate net flow
      const netFlow = (actualInflows + predictedInflows) - (actualOutflows + predictedOutflows);
      
      // Get categories for this week
      const categories = weekTransactions.reduce((acc, t) => {
        const cat = t.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      weeks.push({
        weekIndex: i,
        weekNumber: i + 1,
        weekStart,
        weekEnd,
        actualInflows,
        actualOutflows,
        predictedInflows,
        predictedOutflows,
        netFlow,
        runningBalance: 0, // Will be calculated below
        hasActualData: weekTransactions.length > 0,
        transactionCount: weekTransactions.length,
        categories,
        prediction
      });
    }
    
    // Calculate running balances
    let runningBalance = initialBalance;
    weeks.forEach(week => {
      runningBalance += week.netFlow;
      week.runningBalance = runningBalance;
    });
    
    return weeks;
  }, [transactions, predictions, initialBalance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const openPredictionModal = (weekIndex: number) => {
    const existing = predictions.find(p => p.weekIndex === weekIndex);
    setEditingWeekIndex(weekIndex);
    setInflowInput(existing?.inflowAmount.toString() || '');
    setOutflowInput(existing?.outflowAmount.toString() || '');
    setDescriptionInput(existing?.description || '');
    onOpen();
  };

  const savePrediction = () => {
    if (editingWeekIndex === null) return;
    
    const inflowAmount = parseFloat(inflowInput) || 0;
    const outflowAmount = parseFloat(outflowInput) || 0;
    
    if (inflowAmount === 0 && outflowAmount === 0) {
      // Remove prediction if both are zero
      setPredictions(prev => prev.filter(p => p.weekIndex !== editingWeekIndex));
    } else {
      // Add or update prediction
      setPredictions(prev => {
        const filtered = prev.filter(p => p.weekIndex !== editingWeekIndex);
        filtered.push({
          weekIndex: editingWeekIndex,
          inflowAmount,
          outflowAmount,
          description: descriptionInput
        });
        return filtered;
      });
    }
    
    // Reset and close
    setInflowInput('');
    setOutflowInput('');
    setDescriptionInput('');
    setEditingWeekIndex(null);
    onClose();
  };

  // Calculate totals
  const totalActualInflows = weeklyData.reduce((sum, week) => sum + week.actualInflows, 0);
  const totalActualOutflows = weeklyData.reduce((sum, week) => sum + week.actualOutflows, 0);
  const totalPredictedInflows = weeklyData.reduce((sum, week) => sum + week.predictedInflows, 0);
  const totalPredictedOutflows = weeklyData.reduce((sum, week) => sum + week.predictedOutflows, 0);
  const finalBalance = weeklyData[weeklyData.length - 1]?.runningBalance || initialBalance;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Total Inflows</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(totalActualInflows + totalPredictedInflows)}
                </p>
                <div className="text-xs text-green-600 mt-1">
                  Actual: {formatCurrency(totalActualInflows)} | Predicted: {formatCurrency(totalPredictedInflows)}
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Total Outflows</p>
                <p className="text-xl font-bold text-red-800">
                  {formatCurrency(totalActualOutflows + totalPredictedOutflows)}
                </p>
                <div className="text-xs text-red-600 mt-1">
                  Actual: {formatCurrency(totalActualOutflows)} | Predicted: {formatCurrency(totalPredictedOutflows)}
                </div>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={`bg-white border shadow-sm hover:shadow-md transition-shadow ${
          (totalActualInflows + totalPredictedInflows) - (totalActualOutflows + totalPredictedOutflows) >= 0 
            ? 'border-green-200' : 'border-red-200'
        }`}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Net Cash Flow</p>
                <p className={`text-xl font-bold ${
                  (totalActualInflows + totalPredictedInflows) - (totalActualOutflows + totalPredictedOutflows) >= 0 
                    ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatCurrency((totalActualInflows + totalPredictedInflows) - (totalActualOutflows + totalPredictedOutflows))}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Final Balance</p>
                <p className={`text-xl font-bold ${finalBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(finalBalance)}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Action Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">13-Week Cash Flow Forecast</h3>
                <p className="text-gray-600">AI-categorized actual data + your predictions = complete cash flow visibility</p>
              </div>
            </div>
            <Chip color="secondary" variant="flat" className="bg-purple-100 text-purple-800 font-medium">
              {predictions.length} Active Predictions
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* 13-Week Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900">13-Week Rolling Forecast</h3>
        </CardHeader>
        <CardBody className="p-0">
          <Table 
            aria-label="13-week cash flow forecast"
            classNames={{
              wrapper: "bg-white",
              th: "bg-gray-50 text-gray-700 font-semibold",
              td: "text-gray-900"
            }}
          >
            <TableHeader>
              <TableColumn>WEEK</TableColumn>
              <TableColumn>ACTUAL INFLOWS</TableColumn>
              <TableColumn>ACTUAL OUTFLOWS</TableColumn>
              <TableColumn>PREDICTED INFLOWS</TableColumn>
              <TableColumn>PREDICTED OUTFLOWS</TableColumn>
              <TableColumn>NET FLOW</TableColumn>
              <TableColumn>RUNNING BALANCE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {weeklyData.map((week) => (
                <TableRow key={week.weekIndex} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">Week {week.weekNumber}</p>
                      <p className="text-sm text-gray-600">
                        {formatDateRange(week.weekStart, week.weekEnd)}
                      </p>
                      {week.hasActualData && (
                        <div className="mt-2">
                          <Chip size="sm" variant="flat" className="bg-green-100 text-green-800">
                            📊 {week.transactionCount} transactions
                          </Chip>
                          {Object.keys(week.categories).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(week.categories).slice(0, 2).map(([category, count]) => (
                                <Chip key={category} size="sm" variant="flat" className="bg-purple-100 text-purple-800 text-xs">
                                  {category}: {count}
                                </Chip>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <span className={`font-bold text-lg ${
                        week.actualInflows > 0 ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {formatCurrency(week.actualInflows)}
                      </span>
                      {week.actualInflows > 0 && (
                        <p className="text-xs text-green-600">From CSV data</p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <span className={`font-bold text-lg ${
                        week.actualOutflows > 0 ? 'text-red-700' : 'text-gray-400'
                      }`}>
                        {formatCurrency(week.actualOutflows)}
                      </span>
                      {week.actualOutflows > 0 && (
                        <p className="text-xs text-red-600">From CSV data</p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <span className={`font-bold text-lg ${
                        week.predictedInflows > 0 ? 'text-blue-700' : 'text-gray-400'
                      }`}>
                        {formatCurrency(week.predictedInflows)}
                      </span>
                      {week.predictedInflows > 0 && week.prediction?.description && (
                        <p className="text-xs text-blue-600 truncate" title={week.prediction.description}>
                          💡 {week.prediction.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <span className={`font-bold text-lg ${
                        week.predictedOutflows > 0 ? 'text-orange-700' : 'text-gray-400'
                      }`}>
                        {formatCurrency(week.predictedOutflows)}
                      </span>
                      {week.predictedOutflows > 0 && week.prediction?.description && (
                        <p className="text-xs text-orange-600 truncate" title={week.prediction.description}>
                          💡 {week.prediction.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      color={week.netFlow >= 0 ? 'success' : 'danger'}
                      variant="flat"
                      size="md"
                      className={`font-bold ${
                        week.netFlow >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {formatCurrency(week.netFlow)}
                    </Chip>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${
                        week.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(week.runningBalance)}
                      </span>
                      {week.runningBalance < 0 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      size="sm"
                      variant="solid"
                      color="primary"
                      startContent={week.prediction ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      onClick={() => openPredictionModal(week.weekIndex)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {week.prediction ? 'Edit' : 'Add'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Simple Prediction Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              {editingWeekIndex !== null && predictions.find(p => p.weekIndex === editingWeekIndex) ? 'Edit' : 'Add'} Prediction
            </h3>
            <p className="text-sm text-gray-600">
              Week {editingWeekIndex !== null ? editingWeekIndex + 1 : ''}
              {editingWeekIndex !== null && weeklyData[editingWeekIndex] && (
                ` (${formatDateRange(weeklyData[editingWeekIndex].weekStart, weeklyData[editingWeekIndex].weekEnd)})`
              )}
            </p>
          </ModalHeader>
          
          <ModalBody className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Predicted Inflows"
                  placeholder="0.00"
                  value={inflowInput}
                  onChange={(e) => setInflowInput(e.target.value)}
                  startContent={<TrendingUp className="h-4 w-4 text-green-600" />}
                  type="number"
                  step="0.01"
                  min="0"
                />
                
                <Input
                  label="Predicted Outflows"
                  placeholder="0.00"
                  value={outflowInput}
                  onChange={(e) => setOutflowInput(e.target.value)}
                  startContent={<TrendingDown className="h-4 w-4 text-red-600" />}
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <Textarea
                label="Description"
                placeholder="e.g., Expected client payment, Quarterly rent payment, Payroll processing"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                minRows={2}
                maxRows={4}
              />
              
              {/* Preview */}
              {(parseFloat(inflowInput) > 0 || parseFloat(outflowInput) > 0) && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Prediction Preview</h4>
                  <div className="space-y-1 text-sm">
                    {parseFloat(inflowInput) > 0 && (
                      <p className="text-green-700">+ {formatCurrency(parseFloat(inflowInput))} inflow</p>
                    )}
                    {parseFloat(outflowInput) > 0 && (
                      <p className="text-red-700">- {formatCurrency(parseFloat(outflowInput))} outflow</p>
                    )}
                    <p className="font-medium text-blue-800">
                      Net impact: {formatCurrency((parseFloat(inflowInput) || 0) - (parseFloat(outflowInput) || 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          
          <ModalFooter className="border-t border-gray-200">
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={savePrediction}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Save Prediction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}