
import React, { useState } from 'react';
import { AlertCircle, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import FileUpload from '@/components/data/FileUpload';
import { 
  parseCSV, generateDataProfile, generateCleaningSuggestions,
  cleanDataset, convertToCSV, CleaningSuggestion, DatasetType, DataProfile
} from '@/utils/dataUtils';

const DataCleaning = () => {
  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const [cleanedDataset, setCleanedDataset] = useState<DatasetType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setDataset(parsedData);
      
      // Generate the profile and suggestions
      const dataProfile = generateDataProfile(parsedData);
      setProfile(dataProfile);
      
      const cleaningSuggestions = generateCleaningSuggestions(dataProfile);
      setSuggestions(cleaningSuggestions);
      
      // Select all suggestions by default
      setSelectedSuggestions(cleaningSuggestions.map((_, index) => index));
      
      // Reset cleaned dataset
      setCleanedDataset(null);
    } catch (error) {
      toast.error('Error parsing CSV file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  const applyCleaningActions = () => {
    if (!dataset || !profile) return;
    
    setIsProcessing(true);
    
    try {
      // Get selected suggestions
      const selectedSuggestionsArr = suggestions.filter((_, index) => 
        selectedSuggestions.includes(index)
      );
      
      // Apply cleaning actions
      const cleaned = cleanDataset(dataset, profile, selectedSuggestionsArr);
      setCleanedDataset(cleaned);
      
      toast.success('Data cleaning completed successfully');
    } catch (error) {
      toast.error('Error cleaning data');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const downloadCleanedData = () => {
    if (!cleanedDataset) return;
    
    try {
      // Convert to CSV
      const csvContent = convertToCSV(cleanedDataset);
      
      // Create a Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleaned_${cleanedDataset.filename}`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Cleaned dataset downloaded successfully');
    } catch (error) {
      toast.error('Error downloading file');
      console.error(error);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold">Data Cleaning</h1>
          <p className="text-muted-foreground mt-2">
            Automatically detect and fix issues in your data
          </p>
        </div>
        
        {!dataset ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-medium">{dataset.filename}</span>
                <Badge>{dataset.data.length} rows</Badge>
                <Badge variant="outline">{dataset.fields.length} columns</Badge>
              </div>
              
              <Button 
                onClick={() => {
                  setDataset(null);
                  setProfile(null);
                  setSuggestions([]);
                  setSelectedSuggestions([]);
                  setCleanedDataset(null);
                }}
                variant="outline"
              >
                Upload New File
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center p-12">
                <p>Analyzing data...</p>
                <Progress value={45} className="w-1/2 mx-auto mt-4" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Issues</CardTitle>
                      <CardDescription>
                        Select the issues you want to fix in your dataset
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {suggestions.length === 0 ? (
                        <div className="text-center p-6 border rounded-md">
                          <p className="text-muted-foreground">
                            No data issues detected. Your data looks clean!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                              <Checkbox 
                                id={`suggestion-${index}`}
                                checked={selectedSuggestions.includes(index)}
                                onCheckedChange={() => toggleSuggestion(index)}
                              />
                              <div>
                                <label 
                                  htmlFor={`suggestion-${index}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {suggestion.column}:{' '}
                                  <span className="capitalize">{suggestion.issue}</span> values
                                </label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {suggestion.description}
                                </p>
                                <p className="text-sm mt-1">
                                  <span className="text-primary font-medium">Recommendation:</span>{' '}
                                  {suggestion.recommendation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {cleanedDataset && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cleaning Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded-md border">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-5 w-5 text-primary" />
                              <h3 className="font-medium">Data Cleaning Summary</h3>
                            </div>
                            <ul className="text-sm space-y-2">
                              <li>Original rows: {dataset.data.length}</li>
                              <li>Cleaned rows: {cleanedDataset.data.length}</li>
                              <li>
                                Modified cells: {
                                  selectedSuggestions.reduce((count, index) => {
                                    const suggestion = suggestions[index];
                                    if (suggestion.issue === 'missing') {
                                      return count + (suggestion.column ? profile?.columns.find(c => c.name === suggestion.column)?.nullCount || 0 : 0);
                                    }
                                    if (suggestion.issue === 'duplicate') {
                                      return count + (profile?.duplicateRows || 0);
                                    }
                                    return count;
                                  }, 0)
                                }
                              </li>
                              <li>Applied fixes: {selectedSuggestions.length}</li>
                            </ul>
                          </div>
                          
                          <Button onClick={downloadCleanedData} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Cleaned Dataset
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Cleaning</CardTitle>
                      <CardDescription>
                        Apply automated fixes to clean your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {suggestions.length > 0 && (
                        <Button 
                          onClick={applyCleaningActions} 
                          disabled={selectedSuggestions.length === 0 || isProcessing}
                          className="w-full"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Apply {selectedSuggestions.length} Cleaning Actions
                            </>
                          )}
                        </Button>
                      )}
                      
                      <div className="border rounded-md p-4 space-y-3">
                        <h3 className="font-medium">About Data Cleaning</h3>
                        <p className="text-sm text-muted-foreground">
                          Our automated data cleaning tool can help you fix common issues in your data:
                        </p>
                        <ul className="text-sm space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Fill missing values with appropriate defaults</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Remove or fix duplicate rows</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Handle outliers in numeric data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">✓</span>
                            <span>Fix inconsistent formatting</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DataCleaning;
