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
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { Plus, Edit, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Transaction } from './CSVUpload';

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  actualInflows: number;
  actualOutflows: number;
  predictedInflows: number;
  predictedOutflows: number;
  totalInflows: number;
  totalOutflows: number;
  netFlow: number;
  runningBalance: number;
  hasActualData: boolean;
  transactionCount: number;
}

interface PredictionEntry {
  weekNumber: number;
  inflows: number;
  outflows: number;
  description?: string;
}

interface WeeklyCashFlowTableProps {
  transactions: Transaction[];
  initialBalance?: number;
}

export default function WeeklyCashFlowTable({ transactions, initialBalance = 0 }: WeeklyCashFlowTableProps) {
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [tempInflows, setTempInflows] = useState('');
  const [tempOutflows, setTempOutflows] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get the start of the current week (Sunday)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Generate 13 weeks of data starting from current week
  const weeklyData = useMemo(() => {
    const currentWeekStart = getCurrentWeekStart();
    const weeks: WeekData[] = [];
    
    // Group actual transactions by week
    const transactionsByWeek = new Map<string, Transaction[]>();
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const weekStart = new Date(transactionDate);
      weekStart.setDate(transactionDate.getDate() - transactionDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!transactionsByWeek.has(weekKey)) {
        transactionsByWeek.set(weekKey, []);
      }
      transactionsByWeek.get(weekKey)!.push(transaction);
    });

    let runningBalance = initialBalance;

    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekTransactions = transactionsByWeek.get(weekKey) || [];
      
      // Calculate actual flows from transactions
      const actualInflows = weekTransactions
        .filter(t => t.type === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const actualOutflows = weekTransactions
        .filter(t => t.type === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Get predictions for this week
      const prediction = predictions.find(p => p.weekNumber === i + 1);
      const predictedInflows = prediction?.inflows || 0;
      const predictedOutflows = prediction?.outflows || 0;
      
      // Calculate totals
      const totalInflows = actualInflows + predictedInflows;
      const totalOutflows = actualOutflows + predictedOutflows;
      const netFlow = totalInflows - totalOutflows;
      
      runningBalance += netFlow;
      
      const hasActualData = weekTransactions.length > 0;
      
      weeks.push({
        weekNumber: i + 1,
        weekStart,
        weekEnd,
        weekLabel: `Week ${i + 1}`,
        actualInflows,
        actualOutflows,
        predictedInflows,
        predictedOutflows,
        totalInflows,
        totalOutflows,
        netFlow,
        runningBalance,
        hasActualData,
        transactionCount: weekTransactions.length
      });
    }
    
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

  const handleEditPrediction = (weekNumber: number) => {
    const existing = predictions.find(p => p.weekNumber === weekNumber);
    setEditingWeek(weekNumber);
    setTempInflows(existing?.inflows.toString() || '');
    setTempOutflows(existing?.outflows.toString() || '');
    setTempDescription(existing?.description || '');
    onOpen();
  };

  const handleSavePrediction = () => {
    if (editingWeek === null) return;
    
    const inflows = parseFloat(tempInflows) || 0;
    const outflows = parseFloat(tempOutflows) || 0;
    
    setPredictions(prev => {
      const filtered = prev.filter(p => p.weekNumber !== editingWeek);
      if (inflows > 0 || outflows > 0) {
        filtered.push({
          weekNumber: editingWeek,
          inflows,
          outflows,
          description: tempDescription
        });
      }
      return filtered.sort((a, b) => a.weekNumber - b.weekNumber);
    });
    
    onClose();
    setEditingWeek(null);
    setTempInflows('');
    setTempOutflows('');
    setTempDescription('');
  };

  const totalActualInflows = weeklyData.reduce((sum, week) => sum + week.actualInflows, 0);
  const totalActualOutflows = weeklyData.reduce((sum, week) => sum + week.actualOutflows, 0);
  const totalPredictedInflows = weeklyData.reduce((sum, week) => sum + week.predictedInflows, 0);
  const totalPredictedOutflows = weeklyData.reduce((sum, week) => sum + week.predictedOutflows, 0);
  const totalNetFlow = weeklyData.reduce((sum, week) => sum + week.netFlow, 0);
  const finalBalance = weeklyData[weeklyData.length - 1]?.runningBalance || initialBalance;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-success-200 bg-success-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-success-600" />
                <p className="text-sm text-success-600 font-medium">Total Inflows</p>
              </div>
              <p className="text-xl font-bold text-success-700">
                {formatCurrency(totalActualInflows + totalPredictedInflows)}
              </p>
              <div className="text-xs text-success-600 mt-1">
                Actual: {formatCurrency(totalActualInflows)} | Predicted: {formatCurrency(totalPredictedInflows)}
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-danger-200 bg-danger-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-danger-600" />
                <p className="text-sm text-danger-600 font-medium">Total Outflows</p>
              </div>
              <p className="text-xl font-bold text-danger-700">
                {formatCurrency(totalActualOutflows + totalPredictedOutflows)}
              </p>
              <div className="text-xs text-danger-600 mt-1">
                Actual: {formatCurrency(totalActualOutflows)} | Predicted: {formatCurrency(totalPredictedOutflows)}
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`border ${totalNetFlow >= 0 ? 'border-success-200 bg-success-50/50' : 'border-danger-200 bg-danger-50/50'}`}>
          <CardBody className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-default-600" />
                <p className="text-sm font-medium text-default-600">Net Cash Flow</p>
              </div>
              <p className={`text-xl font-bold ${totalNetFlow >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {formatCurrency(totalNetFlow)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="border border-primary-200 bg-primary-50/50">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                <p className="text-sm text-primary-600 font-medium">Final Balance</p>
              </div>
              <p className={`text-xl font-bold ${finalBalance >= 0 ? 'text-primary-700' : 'text-danger-700'}`}>
                {formatCurrency(finalBalance)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 13-Week Cash Flow Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">13-Week Rolling Cash Flow</h3>
            <p className="text-sm text-default-500">Actual data from uploads + predicted flows</p>
          </div>
          <Button
            color="primary"
            variant="flat"
            startContent={<Plus className="h-4 w-4" />}
            onClick={() => handleEditPrediction(1)}
          >
            Add Predictions
          </Button>
        </CardHeader>
        <CardBody>
          <Table aria-label="13-week cash flow table">
            <TableHeader>
              <TableColumn>WEEK</TableColumn>
              <TableColumn>ACTUAL INFLOWS</TableColumn>
              <TableColumn>PREDICTED INFLOWS</TableColumn>
              <TableColumn>ACTUAL OUTFLOWS</TableColumn>
              <TableColumn>PREDICTED OUTFLOWS</TableColumn>
              <TableColumn>NET FLOW</TableColumn>
              <TableColumn>RUNNING BALANCE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {weeklyData.map((week) => (
                <TableRow key={week.weekNumber}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{week.weekLabel}</p>
                      <p className="text-xs text-default-500">
                        {formatDateRange(week.weekStart, week.weekEnd)}
                      </p>
                      {week.hasActualData && (
                        <Chip size="sm" color="success" variant="flat" className="mt-1">
                          {week.transactionCount} transactions
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${week.actualInflows > 0 ? 'text-success-600' : 'text-default-400'}`}>
                      {formatCurrency(week.actualInflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${week.predictedInflows > 0 ? 'text-primary-600' : 'text-default-400'}`}>
                      {formatCurrency(week.predictedInflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${week.actualOutflows > 0 ? 'text-danger-600' : 'text-default-400'}`}>
                      {formatCurrency(week.actualOutflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${week.predictedOutflows > 0 ? 'text-warning-600' : 'text-default-400'}`}>
                      {formatCurrency(week.predictedOutflows)}
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
                    <span className={`font-medium ${week.runningBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {formatCurrency(week.runningBalance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Edit className="h-3 w-3" />}
                      onClick={() => handleEditPrediction(week.weekNumber)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Prediction Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <ModalHeader>
            <h3>Edit Predictions for Week {editingWeek}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Predicted Inflows"
                placeholder="0.00"
                value={tempInflows}
                onChange={(e) => setTempInflows(e.target.value)}
                startContent={<DollarSign className="h-4 w-4 text-default-400" />}
                type="number"
                step="0.01"
              />
              <Input
                label="Predicted Outflows"
                placeholder="0.00"
                value={tempOutflows}
                onChange={(e) => setTempOutflows(e.target.value)}
                startContent={<DollarSign className="h-4 w-4 text-default-400" />}
                type="number"
                step="0.01"
              />
              <Input
                label="Description (Optional)"
                placeholder="e.g., Expected payroll, vendor payment"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSavePrediction}>
              Save Prediction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}