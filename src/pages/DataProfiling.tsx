
import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import FileUpload from '@/components/data/FileUpload';
import { parseCSV, generateDataProfile, DataProfile, DatasetType } from '@/utils/dataUtils';

const DataProfiling = () => {
  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setDataset(parsedData);
      
      // Generate the profile
      const dataProfile = generateDataProfile(parsedData);
      setProfile(dataProfile);
    } catch (error) {
      toast.error('Error parsing CSV file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadReport = () => {
    if (!profile) return;
    
    // Format the profile data as JSON
    const profileJson = JSON.stringify(profile, null, 2);
    const blob = new Blob([profileJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset?.filename.replace('.csv', '')}_profile.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Profile report downloaded successfully');
  };
  
  return (
    <Layout>
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold">Data Profiling</h1>
          <p className="text-muted-foreground mt-2">
            Upload your CSV file to generate a comprehensive profile of your data
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
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setDataset(null);
                    setProfile(null);
                  }}
                  variant="outline"
                >
                  Upload New File
                </Button>
                
                {profile && (
                  <Button onClick={downloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center p-12">
                <p>Analyzing data...</p>
                <Progress value={45} className="w-1/2 mx-auto mt-4" />
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{profile.rowCount}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{profile.columnCount}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Null Values</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col">
                        <p className="text-3xl font-bold">{profile.nullValues}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.nullPercentage.toFixed(2)}% of all cells
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Duplicate Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col">
                        <p className="text-3xl font-bold">{profile.duplicateRows}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.duplicatePercentage.toFixed(2)}% of all rows
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Column Analysis</CardTitle>
                    <CardDescription>
                      Detailed statistics for each column in your dataset
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview">
                      <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="details">Detailed Stats</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Column</th>
                                <th className="text-left py-2 px-4">Type</th>
                                <th className="text-left py-2 px-4">Unique Values</th>
                                <th className="text-left py-2 px-4">Null Values</th>
                              </tr>
                            </thead>
                            <tbody>
                              {profile.columns.map((column, index) => (
                                <tr key={index} className="border-b hover:bg-muted/50">
                                  <td className="py-2 px-4 font-medium">{column.name}</td>
                                  <td className="py-2 px-4">
                                    <Badge variant="outline" className="capitalize">
                                      {column.type}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-4">
                                    {column.uniqueCount} 
                                    <span className="text-muted-foreground text-xs ml-1">
                                      ({((column.uniqueCount || 0) / profile.rowCount * 100).toFixed(1)}%)
                                    </span>
                                  </td>
                                  <td className="py-2 px-4">
                                    {column.nullCount}
                                    <span className="text-muted-foreground text-xs ml-1">
                                      ({column.nullPercentage?.toFixed(1)}%)
                                    </span>
                                    {column.nullPercentage && column.nullPercentage > 0 && (
                                      <Progress 
                                        value={column.nullPercentage} 
                                        className="h-1 w-24 mt-1"
                                      />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="details">
                        <div className="grid grid-cols-1 gap-6">
                          {profile.columns.map((column, index) => (
                            <Card key={index}>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                  <CardTitle>{column.name}</CardTitle>
                                  <Badge variant="outline" className="capitalize">
                                    {column.type}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Unique Values</p>
                                    <p className="font-medium">{column.uniqueCount}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-muted-foreground">Null Values</p>
                                    <p className="font-medium">
                                      {column.nullCount} ({column.nullPercentage?.toFixed(1)}%)
                                    </p>
                                  </div>
                                  
                                  {column.type === 'number' && (
                                    <>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Min / Max</p>
                                        <p className="font-medium">
                                          {column.min?.toFixed(2)} / {column.max?.toFixed(2)}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm text-muted-foreground">Mean / Median</p>
                                        <p className="font-medium">
                                          {column.mean?.toFixed(2)} / {column.median?.toFixed(2)}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                  
                                  {(column.type === 'string' || column.type === 'boolean') && column.mode && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Most Common Value</p>
                                      <p className="font-medium">{column.mode}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {column.categories && Object.keys(column.categories).length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium mb-2">Category Distribution</p>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                      {Object.entries(column.categories)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 10)
                                        .map(([category, count]) => (
                                          <div key={category} className="flex justify-between">
                                            <span className="truncate">{category}</span>
                                            <span className="text-muted-foreground">{count}</span>
                                          </div>
                                        ))}
                                    </div>
                                    {Object.keys(column.categories).length > 10 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Showing top 10 of {Object.keys(column.categories).length} categories
                                      </p>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center p-12">
                <p>Something went wrong. Please try uploading a different file.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DataProfiling;
