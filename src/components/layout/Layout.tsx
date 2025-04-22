
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Bot, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => {
  return (
    <Button
      asChild
      variant={isActive ? "default" : "ghost"}
      className={cn(
        "w-full justify-start mb-1",
        isActive ? "bg-primary" : "hover:bg-secondary/20"
      )}
    >
      <Link to={to} className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </Link>
    </Button>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-7 w-7" />
            <span>Smart Data Standardization</span>
          </Link>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="w-64 bg-muted p-4 hidden md:block border-r">
          <nav className="space-y-2">
            <NavItem 
              to="/data-profiling" 
              icon={<FileText className="h-5 w-5" />} 
              label="Data Profiling" 
              isActive={currentPath === "/data-profiling"} 
            />
            <NavItem 
              to="/data-visualization" 
              icon={<BarChart3 className="h-5 w-5" />} 
              label="Data Visualization" 
              isActive={currentPath === "/data-visualization"} 
            />
            <NavItem 
              to="/data-cleaning" 
              icon={<Database className="h-5 w-5" />} 
              label="Data Cleaning" 
              isActive={currentPath === "/data-cleaning"} 
            />
            <NavItem 
              to="/data-bot" 
              icon={<Bot className="h-5 w-5" />} 
              label="Data Bot" 
              isActive={currentPath === "/data-bot"} 
            />
          </nav>
        </aside>
        
        <main className="flex-1 p-6 bg-background overflow-y-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
