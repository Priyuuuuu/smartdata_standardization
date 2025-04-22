
import React, { useState, useRef } from 'react';
import { Bot, ChevronRight, FileSpreadsheet, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import FileUpload from '@/components/data/FileUpload';
import { parseCSV, DatasetType } from '@/utils/dataUtils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  loading?: boolean;
}

const DataBot = () => {
  const [dataset, setDataset] = useState<DatasetType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Data Bot. Upload a CSV file and ask me questions about your data.',
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setDataset(parsedData);
      
      // Add welcome message
      addMessage({
        id: Date.now().toString(),
        content: `I've loaded your dataset "${file.name}" with ${parsedData.data.length} rows and ${parsedData.fields.length} columns. What would you like to know about it?`,
        sender: 'bot'
      });
      
    } catch (error) {
      toast.error('Error parsing CSV file');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (!input.trim() || !dataset) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user'
    };
    
    addMessage(userMessage);
    
    const botMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'bot',
      loading: true
    };
    
    addMessage(botMessage);
    
    // Process the user's question
    setTimeout(() => {
      const answer = generateAnswer(input, dataset);
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessage.id 
          ? { ...msg, content: answer, loading: false }
          : msg
      ));
      
      scrollToBottom();
    }, 1000);
    
    setInput('');
  };
  
  const generateAnswer = (question: string, dataset: DatasetType): string => {
    const { data, fields } = dataset;
    const questionLower = question.toLowerCase();
    
    // Simple pattern matching for common questions
    if (questionLower.includes('how many rows') || questionLower.includes('how many records')) {
      return `There are ${data.length} rows in this dataset.`;
    }
    
    if (questionLower.includes('how many columns') || questionLower.includes('how many fields')) {
      return `There are ${fields.length} columns in this dataset: ${fields.join(', ')}.`;
    }
    
    if (questionLower.includes('what columns') || questionLower.includes('what fields')) {
      return `The columns in this dataset are: ${fields.join(', ')}.`;
    }
    
    // Look for column names in the question
    const mentionedColumn = fields.find(field => 
      questionLower.includes(field.toLowerCase())
    );
    
    if (mentionedColumn) {
      // Check for different question types related to a specific column
      if (questionLower.includes('maximum') || questionLower.includes('max') || questionLower.includes('highest')) {
        // Find maximum value
        const values = data.map(row => row[mentionedColumn]).filter(v => v !== null && v !== undefined);
        if (values.length > 0 && typeof values[0] === 'number') {
          const max = Math.max(...values as number[]);
          return `The maximum value in the "${mentionedColumn}" column is ${max}.`;
        }
      }
      
      if (questionLower.includes('minimum') || questionLower.includes('min') || questionLower.includes('lowest')) {
        // Find minimum value
        const values = data.map(row => row[mentionedColumn]).filter(v => v !== null && v !== undefined);
        if (values.length > 0 && typeof values[0] === 'number') {
          const min = Math.min(...values as number[]);
          return `The minimum value in the "${mentionedColumn}" column is ${min}.`;
        }
      }
      
      if (questionLower.includes('average') || questionLower.includes('mean')) {
        // Calculate average
        const values = data.map(row => row[mentionedColumn]).filter(v => typeof v === 'number');
        if (values.length > 0) {
          const sum = values.reduce((a, b) => (a as number) + (b as number), 0);
          const avg = (sum as number) / values.length;
          return `The average value in the "${mentionedColumn}" column is ${avg.toFixed(2)}.`;
        }
      }
      
      if (questionLower.includes('unique') || questionLower.includes('distinct')) {
        // Find unique values
        const values = data.map(row => row[mentionedColumn]);
        const uniqueValues = [...new Set(values)];
        return `There are ${uniqueValues.length} unique values in the "${mentionedColumn}" column.`;
      }
      
      if (questionLower.includes('missing') || questionLower.includes('null') || questionLower.includes('empty')) {
        // Count missing values
        const missingCount = data.filter(row => 
          row[mentionedColumn] === null || 
          row[mentionedColumn] === undefined || 
          row[mentionedColumn] === ''
        ).length;
        const percentage = (missingCount / data.length) * 100;
        return `There are ${missingCount} missing values (${percentage.toFixed(2)}%) in the "${mentionedColumn}" column.`;
      }
      
      // Generic column info
      const uniqueValues = [...new Set(data.map(row => row[mentionedColumn]))];
      const missingCount = data.filter(row => 
        row[mentionedColumn] === null || 
        row[mentionedColumn] === undefined || 
        row[mentionedColumn] === ''
      ).length;
      
      return `Information about "${mentionedColumn}": 
- ${uniqueValues.length} unique values
- ${missingCount} missing values (${((missingCount / data.length) * 100).toFixed(2)}%)
- Type: ${typeof data[0][mentionedColumn]}`;
    }
    
    // Generic response
    return `I'm not sure how to answer that question about your data. Try asking about specific columns, row counts, or statistics like maximum, minimum, or average values.`;
  };
  
  const suggestedQuestions = [
    "How many rows are in this dataset?",
    "What columns are available?",
    "What's the average of [column]?",
    "How many missing values are in [column]?",
    "What's the maximum value in [column]?",
    "How many unique values are in [column]?"
  ];
  
  const handleSuggestedQuestion = (question: string) => {
    if (!dataset) return;
    
    // Replace [column] with an actual column name if available
    let processedQuestion = question;
    if (question.includes('[column]') && dataset.fields.length > 0) {
      // Try to find a numeric column for questions about max, min, average
      let preferredColumn = dataset.fields[0];
      if (
        (question.includes('maximum') || question.includes('minimum') || question.includes('average')) && 
        dataset.data.length > 0
      ) {
        const numericColumn = dataset.fields.find(field => 
          typeof dataset.data[0][field] === 'number'
        );
        if (numericColumn) {
          preferredColumn = numericColumn;
        }
      }
      processedQuestion = question.replace('[column]', preferredColumn);
    }
    
    setInput(processedQuestion);
  };
  
  return (
    <Layout>
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-3xl font-bold">Data Bot</h1>
          <p className="text-muted-foreground mt-2">
            Ask questions about your data and get instant insights
          </p>
        </div>
        
        {!dataset ? (
          <FileUpload onFileUpload={handleFileUpload} />
        ) : (
          <div className="space-y-4">
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
                  setMessages([
                    {
                      id: '1',
                      content: 'Hello! I\'m Data Bot. Upload a CSV file and ask me questions about your data.',
                      sender: 'bot'
                    }
                  ]);
                }}
                variant="outline"
              >
                Upload New File
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card className="h-[60vh] flex flex-col">
                  <CardContent className="flex-1 flex flex-col p-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map(message => (
                        <div 
                          key={message.id} 
                          className={`flex ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div 
                            className={`flex max-w-[80%] items-start gap-3 ${
                              message.sender === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            } p-3 rounded-lg`}
                          >
                            {message.sender === 'bot' && (
                              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              {message.loading ? (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                </div>
                              ) : (
                                <p className="whitespace-pre-line">{message.content}</p>
                              )}
                            </div>
                            {message.sender === 'user' && (
                              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <Separator />
                    
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask a question about your data..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage} size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4">Suggested Questions</h3>
                    <div className="space-y-2">
                      {suggestedQuestions.map((question, index) => (
                        <Button 
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-2 px-3"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{question}</span>
                        </Button>
                      ))}
                    </div>
                    
                    {dataset && dataset.fields.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">Available Columns</h3>
                        <div className="flex flex-wrap gap-2">
                          {dataset.fields.map((field, index) => (
                            <Badge key={index} variant="outline">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DataBot;
