
import React, { useState, useRef } from 'react';
import { BarChart3, LineChart, PieChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import FileUpload from '@/components/data/FileUpload';
import { parseCSV, generateDataProfile, categorizeColumns, DatasetType } from '@/utils/dataUtils';
import { BarChart, LineChart as RechartLine, PieChart as RechartPie, 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, 
  ResponsiveContainer, Pie, Cell } from 'recharts';

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'line', label: 'Line Chart', icon: <LineChart className="h-4 w-4" /> },
  { id: 'pie', label: 'Pie Chart', icon: <PieChart className="h-4 w-4" /> },
];

const COLORS = ['#4A6FA5', '#6B7FD7', '#9B87F5', '#BB86FC', '#FF8042'];

const DataVisualization = () => {
  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>('bar');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMeasure, setSelectedMeasure] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setDataset(parsedData);
      
      // Generate the profile to categorize columns
      const dataProfile = generateDataProfile(parsedData);
      const { dimensions, measures } = categorizeColumns(dataProfile);
      
      setDimensions(dimensions);
      setMeasures(measures);
      
      if (dimensions.length > 0) setSelectedDimension(dimensions[0]);
      if (measures.length > 0) setSelectedMeasure(measures[0]);
      
    } catch (error) {
      toast.error('Error parsing CSV file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const prepareChartData = () => {
    if (!dataset || !selectedDimension || !selectedMeasure) return [];
    
    // Group data by dimension and calculate sum of measure
    const groupedData = dataset.data.reduce((acc, row) => {
      const dimensionValue = String(row[selectedDimension] || 'Unknown');
      const measureValue = Number(row[selectedMeasure]) || 0;
      
      if (!acc[dimensionValue]) {
        acc[dimensionValue] = { [selectedDimension]: dimensionValue, [selectedMeasure]: 0 };
      }
      
      acc[dimensionValue][selectedMeasure] += measureValue;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by measure value for better visualization
    return Object.values(groupedData)
      .sort((a, b) => b[selectedMeasure] - a[selectedMeasure])
      .slice(0, 20); // Limit to top 20 for better visualization
  };
  
  const downloadChart = () => {
    if (!chartRef.current) return;
    
    try {
      // Using html2canvas to take a screenshot of the chart
      import('html2canvas').then((html2canvas) => {
        html2canvas.default(chartRef.current!).then(canvas => {
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${selectedDimension}_by_${selectedMeasure}_${chartType}_chart.png`;
          link.href = url;
          link.click();
          toast.success('Chart downloaded successfully');
        });
      });
    } catch (error) {
      toast.error('Failed to download chart');
      console.error(error);
    }
  };
  
  const chartData = prepareChartData();
  
  const renderChart = () => {
    if (chartData.length === 0) return null;
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={selectedDimension} 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={selectedMeasure} fill="#9B87F5" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartLine data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={selectedDimension} 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={selectedMeasure} stroke="#9B87F5" strokeWidth={2} />
            </RechartLine>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartPie margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey={selectedMeasure}
                nameKey={selectedDimension}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartPie>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold">Data Visualization</h1>
          <p className="text-muted-foreground mt-2">
            Create charts and graphs to visualize your data
          </p>
        </div>
        
        {!dataset ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">{dataset.filename}</p>
              <Button 
                onClick={() => {
                  setDataset(null);
                  setDimensions([]);
                  setMeasures([]);
                  setSelectedDimension('');
                  setSelectedMeasure('');
                }}
                variant="outline"
              >
                Upload New File
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center p-12">
                <p>Processing data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Chart Options</CardTitle>
                    <CardDescription>
                      Select dimensions and measures to create your visualization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Chart Type
                      </label>
                      <Tabs 
                        defaultValue="bar" 
                        value={chartType} 
                        onValueChange={setChartType}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-3 w-full">
                          {CHART_TYPES.map(type => (
                            <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-1">
                              {type.icon}
                              <span className="hidden sm:inline">{type.label}</span>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Dimension (X-Axis)
                      </label>
                      <Select 
                        value={selectedDimension} 
                        onValueChange={setSelectedDimension}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dimension" />
                        </SelectTrigger>
                        <SelectContent>
                          {dimensions.map(dim => (
                            <SelectItem key={dim} value={dim}>
                              {dim}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Measure (Y-Axis)
                      </label>
                      <Select 
                        value={selectedMeasure} 
                        onValueChange={setSelectedMeasure}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select measure" />
                        </SelectTrigger>
                        <SelectContent>
                          {measures.map(measure => (
                            <SelectItem key={measure} value={measure}>
                              {measure}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {chartData.length > 0 && (
                      <Button 
                        onClick={downloadChart} 
                        className="w-full mt-4"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Chart
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>
                      {selectedDimension && selectedMeasure 
                        ? `${selectedMeasure} by ${selectedDimension}` 
                        : 'Chart Preview'
                      }
                    </CardTitle>
                    <CardDescription>
                      {chartData.length 
                        ? `Showing ${chartData.length} data points` 
                        : 'Select dimension and measure to generate chart'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div ref={chartRef} className="chart-container">
                      {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full border rounded-md">
                          <p className="text-muted-foreground">
                            Select dimensions and measures to create a chart
                          </p>
                        </div>
                      ) : (
                        renderChart()
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DataVisualization;
