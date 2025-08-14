"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Chip,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { Calendar, TrendingUp, TrendingDown, Plus, Download, Target } from 'lucide-react';
import { WeeklyForecast, generateNext13Weeks, isDateInWeek, ForecastSummary } from '@/types/forecast';
import { Transaction } from './CSVUpload';

interface ForecastingToolProps {
  transactions: Transaction[];
}

export default function ForecastingTool({ transactions }: ForecastingToolProps) {
  const [forecasts, setForecasts] = useState<WeeklyForecast[]>(() => generateNext13Weeks());
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [tempInflows, setTempInflows] = useState('');
  const [tempOutflows, setTempOutflows] = useState('');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [activeTab, setActiveTab] = useState('forecast');

  // Populate actual data from transactions
  const forecastsWithActuals = useMemo(() => {
    return forecasts.map(forecast => {
      // Find transactions that fall within this week
      const weekTransactions = transactions.filter(transaction => 
        isDateInWeek(transaction.date, forecast.weekStart, forecast.weekEnd)
      );
      
      const actualInflows = weekTransactions
        .filter(t => t.type === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const actualOutflows = weekTransactions
        .filter(t => t.type === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netActual = actualInflows - actualOutflows;
      const netForecast = forecast.predictedInflows - forecast.predictedOutflows;
      const variance = netActual - netForecast;
      
      return {
        ...forecast,
        actualInflows,
        actualOutflows,
        netActual,
        netForecast,
        variance,
        hasActualData: weekTransactions.length > 0
      };
    });
  }, [forecasts, transactions]);

  // Calculate summary statistics
  const summary: ForecastSummary = useMemo(() => {
    const totalForecastInflows = forecastsWithActuals.reduce((sum, f) => sum + f.predictedInflows, 0);
    const totalForecastOutflows = forecastsWithActuals.reduce((sum, f) => sum + f.predictedOutflows, 0);
    const totalActualInflows = forecastsWithActuals.reduce((sum, f) => sum + f.actualInflows, 0);
    const totalActualOutflows = forecastsWithActuals.reduce((sum, f) => sum + f.actualOutflows, 0);
    
    const totalForecastNet = totalForecastInflows - totalForecastOutflows;
    const totalActualNet = totalActualInflows - totalActualOutflows;
    const totalVariance = totalActualNet - totalForecastNet;
    
    // Calculate accuracy based on weeks with actual data
    const weeksWithData = forecastsWithActuals.filter(f => f.hasActualData);
    const accuracy = weeksWithData.length > 0 
      ? weeksWithData.reduce((sum, f) => {
          const forecastNet = f.predictedInflows - f.predictedOutflows;
          const actualNet = f.actualInflows - f.actualOutflows;
          const weekAccuracy = forecastNet !== 0 ? Math.max(0, 100 - Math.abs((actualNet - forecastNet) / forecastNet * 100)) : 100;
          return sum + weekAccuracy;
        }, 0) / weeksWithData.length
      : 0;
    
    return {
      totalForecastInflows,
      totalForecastOutflows,
      totalActualInflows,
      totalActualOutflows,
      totalForecastNet,
      totalActualNet,
      totalVariance,
      accuracy
    };
  }, [forecastsWithActuals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleEditWeek = (weekNumber: number) => {
    const week = forecasts.find(f => f.weekNumber === weekNumber);
    if (week) {
      setEditingWeek(weekNumber);
      setTempInflows(week.predictedInflows.toString());
      setTempOutflows(week.predictedOutflows.toString());
      onOpen();
    }
  };

  const handleSaveForecast = () => {
    if (editingWeek !== null) {
      const inflows = parseFloat(tempInflows) || 0;
      const outflows = parseFloat(tempOutflows) || 0;
      
      setForecasts(prev => prev.map(forecast => 
        forecast.weekNumber === editingWeek
          ? {
              ...forecast,
              predictedInflows: inflows,
              predictedOutflows: outflows,
              netForecast: inflows - outflows
            }
          : forecast
      ));
      
      setEditingWeek(null);
      setTempInflows('');
      setTempOutflows('');
    }
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) < 1000) return 'default';
    return variance > 0 ? 'success' : 'danger';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'success';
    if (accuracy >= 70) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            13-Week Cash Flow Forecast
          </h2>
          <p className="text-gray-600 mt-2">
            Plan and track your cash flow for the next 13 weeks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            color="primary"
            startContent={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingWeek(1);
              setTempInflows('');
              setTempOutflows('');
              onOpen();
            }}
          >
            Add Forecast
          </Button>
          
          <Button
            variant="bordered"
            startContent={<Download className="h-4 w-4" />}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Export Forecast
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-blue-200">
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm text-blue-700 font-medium">Forecast Net</p>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(summary.totalForecastNet)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`bg-white border ${summary.totalActualNet >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Actual Net</p>
              <p className={`text-2xl font-bold ${summary.totalActualNet >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatCurrency(summary.totalActualNet)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className={`bg-white border ${summary.totalVariance >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Variance</p>
              <p className={`text-2xl font-bold ${summary.totalVariance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {summary.totalVariance >= 0 ? '+' : ''}{formatCurrency(summary.totalVariance)}
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-purple-200">
          <CardBody className="p-6">
            <div className="text-center">
              <p className="text-sm text-purple-700 font-medium">Accuracy</p>
              <p className="text-2xl font-bold text-purple-800">
                {summary.accuracy.toFixed(1)}%
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h3 className="text-xl font-semibold text-gray-900">13-Week Rolling Forecast</h3>
            <Chip color="primary" variant="flat">
              {forecastsWithActuals.filter(f => f.hasActualData).length} weeks with actual data
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <Table aria-label="13-week forecast table">
              <TableHeader>
                <TableColumn>WEEK</TableColumn>
                <TableColumn>FORECAST IN</TableColumn>
                <TableColumn>FORECAST OUT</TableColumn>
                <TableColumn>FORECAST NET</TableColumn>
                <TableColumn>ACTUAL IN</TableColumn>
                <TableColumn>ACTUAL OUT</TableColumn>
                <TableColumn>ACTUAL NET</TableColumn>
                <TableColumn>VARIANCE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {forecastsWithActuals.map((week) => (
                  <TableRow key={week.weekNumber}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{week.weekLabel}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(week.weekStart).toLocaleDateString()} - {new Date(week.weekEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${week.predictedInflows > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {week.predictedInflows > 0 ? formatCurrency(week.predictedInflows) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${week.predictedOutflows > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                        {week.predictedOutflows > 0 ? formatCurrency(week.predictedOutflows) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={week.netForecast >= 0 ? 'success' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {week.predictedInflows > 0 || week.predictedOutflows > 0 ? formatCurrency(week.netForecast) : '-'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${week.hasActualData ? (week.actualInflows > 0 ? 'text-green-700' : 'text-gray-400') : 'text-gray-300'}`}>
                        {week.hasActualData ? (week.actualInflows > 0 ? formatCurrency(week.actualInflows) : '-') : 'No data'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${week.hasActualData ? (week.actualOutflows > 0 ? 'text-red-700' : 'text-gray-400') : 'text-gray-300'}`}>
                        {week.hasActualData ? (week.actualOutflows > 0 ? formatCurrency(week.actualOutflows) : '-') : 'No data'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {week.hasActualData ? (
                        <Chip
                          color={week.netActual >= 0 ? 'success' : 'danger'}
                          variant="flat"
                          size="sm"
                        >
                          {formatCurrency(week.netActual)}
                        </Chip>
                      ) : (
                        <span className="text-gray-300">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {week.hasActualData && (week.predictedInflows > 0 || week.predictedOutflows > 0) ? (
                        <Chip
                          color={getVarianceColor(week.variance)}
                          variant="flat"
                          size="sm"
                        >
                          {week.variance >= 0 ? '+' : ''}{formatCurrency(week.variance)}
                        </Chip>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        onClick={() => handleEditWeek(week.weekNumber)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Edit Forecast Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">
                  Edit Forecast - Week {editingWeek}
                </h3>
                {editingWeek && (
                  <p className="text-sm text-default-500">
                    {forecastsWithActuals.find(f => f.weekNumber === editingWeek)?.weekLabel}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Predicted Inflows"
                    placeholder="Enter expected inflows"
                    value={tempInflows}
                    onChange={(e) => setTempInflows(e.target.value)}
                    startContent={<TrendingUp className="h-4 w-4 text-success-500" />}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  
                  <Input
                    label="Predicted Outflows"
                    placeholder="Enter expected outflows"
                    value={tempOutflows}
                    onChange={(e) => setTempOutflows(e.target.value)}
                    startContent={<TrendingDown className="h-4 w-4 text-danger-500" />}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  
                  {tempInflows && tempOutflows && (
                    <div className="p-4 bg-default-50 rounded-lg">
                      <p className="text-sm text-default-600 mb-2">Forecast Summary:</p>
                      <div className="flex justify-between items-center">
                        <span>Net Cash Flow:</span>
                        <Chip
                          color={(parseFloat(tempInflows) - parseFloat(tempOutflows)) >= 0 ? 'success' : 'danger'}
                          variant="flat"
                        >
                          {formatCurrency(parseFloat(tempInflows) - parseFloat(tempOutflows))}
                        </Chip>
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => {
                  handleSaveForecast();
                  onClose();
                }}>
                  Save Forecast
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}