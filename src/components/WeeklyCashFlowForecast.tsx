"use client";

import { useState, useMemo, useCallback } from 'react';
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
  Input,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem
} from '@heroui/react';
import { Plus, Save, X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Transaction } from './CSVUpload';

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  actualInflows: number;
  actualOutflows: number;
  predictedInflows: number;
  predictedOutflows: number;
  netFlow: number;
  runningBalance: number;
  isHistorical: boolean;
  transactions: Transaction[];
}

interface PredictionEntry {
  id: string;
  weekNumber: number;
  type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  category: string;
}

interface WeeklyCashFlowForecastProps {
  transactions: Transaction[];
  startingBalance?: number;
}

export default function WeeklyCashFlowForecast({ 
  transactions, 
  startingBalance = 0 
}: WeeklyCashFlowForecastProps) {
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [newPrediction, setNewPrediction] = useState({
    type: 'inflow' as 'inflow' | 'outflow',
    amount: '',
    description: '',
    category: ''
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Generate 13 weeks starting from current week
  const weeklyData = useMemo(() => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    const weeks: WeekData[] = [];
    
    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Check if this week is historical (before today)
      const isHistorical = weekEnd < today;
      
      // Get actual transactions for this week
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
      
      // Get predicted flows for this week
      const weekPredictions = predictions.filter(p => p.weekNumber === i);
      const predictedInflows = weekPredictions
        .filter(p => p.type === 'inflow')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const predictedOutflows = weekPredictions
        .filter(p => p.type === 'outflow')
        .reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate net flow (use actual if historical, predicted if future)
      const inflows = isHistorical ? actualInflows : (actualInflows + predictedInflows);
      const outflows = isHistorical ? actualOutflows : (actualOutflows + predictedOutflows);
      const netFlow = inflows - outflows;
      
      weeks.push({
        weekNumber: i,
        weekStart,
        weekEnd,
        actualInflows,
        actualOutflows,
        predictedInflows,
        predictedOutflows,
        netFlow,
        runningBalance: 0, // Will be calculated below
        isHistorical,
        transactions: weekTransactions
      });
    }
    
    // Calculate running balance
    let balance = startingBalance;
    weeks.forEach(week => {
      balance += week.netFlow;
      week.runningBalance = balance;
    });
    
    return weeks;
  }, [transactions, predictions, startingBalance]);

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

  const addPrediction = useCallback(() => {
    if (!newPrediction.amount || !newPrediction.description || editingWeek === null) return;
    
    const prediction: PredictionEntry = {
      id: Date.now().toString(),
      weekNumber: editingWeek,
      type: newPrediction.type,
      amount: parseFloat(newPrediction.amount),
      description: newPrediction.description,
      category: newPrediction.category || 'Other'
    };
    
    setPredictions(prev => [...prev, prediction]);
    setNewPrediction({ type: 'inflow', amount: '', description: '', category: '' });
    onClose();
  }, [newPrediction, editingWeek, onClose]);

  const removePrediction = useCallback((id: string) => {
    setPredictions(prev => prev.filter(p => p.id !== id));
  }, []);

  const openPredictionModal = useCallback((weekNumber: number) => {
    setEditingWeek(weekNumber);
    onOpen();
  }, [onOpen]);

  const getWeekPredictions = useCallback((weekNumber: number) => {
    return predictions.filter(p => p.weekNumber === weekNumber);
  }, [predictions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-primary-200 bg-primary-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-primary-600 font-medium">Starting Balance</p>
              <p className="text-xl font-bold text-primary-700">
                {formatCurrency(startingBalance)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-success-200 bg-success-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-success-600 font-medium">13-Week Inflows</p>
              <p className="text-xl font-bold text-success-700">
                {formatCurrency(weeklyData.reduce((sum, week) => 
                  sum + (week.isHistorical ? week.actualInflows : week.actualInflows + week.predictedInflows), 0
                ))}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-danger-200 bg-danger-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm text-danger-600 font-medium">13-Week Outflows</p>
              <p className="text-xl font-bold text-danger-700">
                {formatCurrency(weeklyData.reduce((sum, week) => 
                  sum + (week.isHistorical ? week.actualOutflows : week.actualOutflows + week.predictedOutflows), 0
                ))}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`border ${
          weeklyData[weeklyData.length - 1]?.runningBalance >= 0 
            ? 'border-success-200 bg-success-50/50' 
            : 'border-danger-200 bg-danger-50/50'
        }`}>
          <CardBody className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-default-600">Ending Balance</p>
              <p className={`text-xl font-bold ${
                weeklyData[weeklyData.length - 1]?.runningBalance >= 0 
                  ? 'text-success-700' 
                  : 'text-danger-700'
              }`}>
                {formatCurrency(weeklyData[weeklyData.length - 1]?.runningBalance || 0)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 13-Week Cash Flow Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">13-Week Rolling Cash Flow Forecast</h3>
            </div>
            <Chip color="secondary" variant="flat">
              {weeklyData.filter(w => !w.isHistorical).length} Future Weeks
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <Table aria-label="13-week cash flow forecast">
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
              {weeklyData.map((week) => {
                const weekPredictions = getWeekPredictions(week.weekNumber);
                return (
                  <TableRow key={week.weekNumber}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          Week {week.weekNumber + 1}
                          {week.isHistorical && (
                            <Chip size="sm" color="default" variant="flat" className="ml-2">
                              Historical
                            </Chip>
                          )}
                        </p>
                        <p className="text-xs text-default-500">
                          {formatDateRange(week.weekStart, week.weekEnd)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-success-600 font-medium">
                        {formatCurrency(week.actualInflows)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-danger-600 font-medium">
                        {formatCurrency(week.actualOutflows)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-success-500">
                        {formatCurrency(week.predictedInflows)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-danger-500">
                        {formatCurrency(week.predictedOutflows)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={week.netFlow >= 0 ? 'success' : 'danger'}
                        variant="flat"
                        size="sm"
                        startContent={
                          week.netFlow >= 0 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                        }
                      >
                        {formatCurrency(week.netFlow)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        week.runningBalance >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatCurrency(week.runningBalance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          startContent={<Plus className="h-3 w-3" />}
                          onClick={() => openPredictionModal(week.weekNumber)}
                          isDisabled={week.isHistorical}
                        >
                          Add
                        </Button>
                        {weekPredictions.length > 0 && (
                          <Chip size="sm" color="secondary" variant="flat">
                            {weekPredictions.length}
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Predictions Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            Add Prediction for Week {(editingWeek || 0) + 1}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Show existing predictions for this week */}
              {editingWeek !== null && getWeekPredictions(editingWeek).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Existing Predictions:</h4>
                  {getWeekPredictions(editingWeek).map((prediction) => (
                    <div key={prediction.id} className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                      <div>
                        <p className="font-medium">{prediction.description}</p>
                        <p className="text-sm text-default-500">{prediction.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip
                          color={prediction.type === 'inflow' ? 'success' : 'danger'}
                          variant="flat"
                          size="sm"
                        >
                          {prediction.type === 'inflow' ? '+' : '-'}{formatCurrency(prediction.amount)}
                        </Chip>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          startContent={<X className="h-3 w-3" />}
                          onClick={() => removePrediction(prediction.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add new prediction form */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Add New Prediction:</h4>
                
                <Select
                  label="Type"
                  selectedKeys={[newPrediction.type]}
                  onSelectionChange={(keys) => {
                    const type = Array.from(keys)[0] as 'inflow' | 'outflow';
                    setNewPrediction(prev => ({ ...prev, type }));
                  }}
                >
                  <SelectItem key="inflow">Inflow</SelectItem>
                  <SelectItem key="outflow">Outflow</SelectItem>
                </Select>
                
                <Input
                  label="Amount"
                  type="number"
                  value={newPrediction.amount}
                  onChange={(e) => setNewPrediction(prev => ({ ...prev, amount: e.target.value }))}
                  startContent="$"
                  placeholder="0.00"
                />
                
                <Input
                  label="Description"
                  value={newPrediction.description}
                  onChange={(e) => setNewPrediction(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Client payment, Rent, Salary"
                />
                
                <Input
                  label="Category"
                  value={newPrediction.category}
                  onChange={(e) => setNewPrediction(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Revenue, Operating Expenses"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={addPrediction}
              startContent={<Save className="h-4 w-4" />}
              isDisabled={!newPrediction.amount || !newPrediction.description}
            >
              Add Prediction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}