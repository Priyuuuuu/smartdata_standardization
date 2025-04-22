
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Bot, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
}

const FeatureCard = ({ title, description, icon, linkTo }: FeatureCardProps) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-2 border-muted hover:border-secondary">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">
          {title === "Data Profiling" && "Analyze your dataset and generate comprehensive reports with statistics, data types, and null value summaries."}
          {title === "Data Visualization" && "Create customized charts and graphs by selecting attributes, dimensions, and visualization types."}
          {title === "Data Cleaning" && "Automatically detect and fix issues in your data including missing values, outliers, and inconsistencies."}
          {title === "Data Bot" && "Ask natural language questions about your data and receive instant insights and analysis."}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={linkTo}>Get Started</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8 fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Smart Data Standardization</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform, analyze, and optimize your data with our comprehensive suite of data tools
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            title="Data Profiling" 
            description="Generate insights about your data"
            icon={<FileText className="h-8 w-8" />}
            linkTo="/data-profiling"
          />
          <FeatureCard 
            title="Data Visualization" 
            description="Create customized charts"
            icon={<BarChart3 className="h-8 w-8" />}
            linkTo="/data-visualization"
          />
          <FeatureCard 
            title="Data Cleaning" 
            description="Fix issues in your dataset"
            icon={<Database className="h-8 w-8" />}
            linkTo="/data-cleaning"
          />
          <FeatureCard 
            title="Data Bot" 
            description="Ask questions about your data"
            icon={<Bot className="h-8 w-8" />}
            linkTo="/data-bot"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
