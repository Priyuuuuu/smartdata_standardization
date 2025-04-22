
import Papa from 'papaparse';

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'mixed';
  uniqueValues?: Array<string | number>;
  uniqueCount?: number;
  nullCount?: number;
  nullPercentage?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  // For categoricals
  categories?: Record<string, number>;
  mode?: string | number;
}

export interface DataProfile {
  rowCount: number;
  columnCount: number;
  columns: DataColumn[];
  nullValues: number;
  nullPercentage: number;
  duplicateRows: number;
  duplicatePercentage: number;
}

export interface CleaningSuggestion {
  column: string;
  issue: 'missing' | 'outlier' | 'inconsistent' | 'duplicate';
  description: string;
  recommendation: string;
  autoFix?: boolean;
}

export interface DatasetType {
  data: Record<string, any>[];
  fields: string[];
  filename: string;
}

// Helper function to parse CSV file into JSON
export const parseCSV = (file: File): Promise<DatasetType> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data as Record<string, any>[],
          fields: results.meta.fields || [],
          filename: file.name
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Function to determine the type of a column
export const determineColumnType = (values: any[]): DataColumn['type'] => {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'string';
  
  const types = nonNullValues.map(value => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      // Check if it's a date
      const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
      if (datePattern.test(value)) return 'date';
      return 'string';
    }
    return 'string';
  });
  
  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length === 1) return uniqueTypes[0] as DataColumn['type'];
  return 'mixed';
};

// Generate a profile of the dataset
export const generateDataProfile = (dataset: DatasetType): DataProfile => {
  const { data, fields } = dataset;
  const rowCount = data.length;
  const columnCount = fields.length;
  
  // Calculate null values
  let totalCells = rowCount * columnCount;
  let nullCount = 0;
  
  // Generate column profiles
  const columns: DataColumn[] = fields.map(field => {
    const values = data.map(row => row[field]);
    const fieldNulls = values.filter(v => v === null || v === undefined || v === '').length;
    nullCount += fieldNulls;
    
    const type = determineColumnType(values);
    
    const column: DataColumn = {
      name: field,
      type,
      nullCount: fieldNulls,
      nullPercentage: (fieldNulls / rowCount) * 100,
      uniqueValues: [...new Set(values)],
    };
    
    column.uniqueCount = column.uniqueValues?.length || 0;
    
    // Calculate statistics for numeric columns
    if (type === 'number') {
      const numericValues = values.filter(v => typeof v === 'number') as number[];
      if (numericValues.length > 0) {
        column.min = Math.min(...numericValues);
        column.max = Math.max(...numericValues);
        column.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        
        // Calculate median
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        column.median = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      }
    }
    
    // Calculate categories for categorical columns
    if (type === 'string' || type === 'boolean') {
      const categories: Record<string, number> = {};
      values.forEach(value => {
        if (value !== null && value !== undefined && value !== '') {
          const key = String(value);
          categories[key] = (categories[key] || 0) + 1;
        }
      });
      column.categories = categories;
      
      // Find mode (most common value)
      let maxCount = 0;
      let mode: string | undefined;
      Object.entries(categories).forEach(([value, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      });
      column.mode = mode;
    }
    
    return column;
  });
  
  // Find duplicate rows
  const stringifiedRows = data.map(row => JSON.stringify(row));
  const uniqueRows = new Set(stringifiedRows);
  const duplicateRows = rowCount - uniqueRows.size;
  
  return {
    rowCount,
    columnCount,
    columns,
    nullValues: nullCount,
    nullPercentage: (nullCount / totalCells) * 100,
    duplicateRows,
    duplicatePercentage: (duplicateRows / rowCount) * 100
  };
};

// Generate cleaning suggestions based on data profile
export const generateCleaningSuggestions = (profile: DataProfile): CleaningSuggestion[] => {
  const suggestions: CleaningSuggestion[] = [];
  
  // Check for columns with missing values
  profile.columns.forEach(column => {
    if (column.nullPercentage && column.nullPercentage > 0) {
      suggestions.push({
        column: column.name,
        issue: 'missing',
        description: `${column.nullCount} missing values (${column.nullPercentage?.toFixed(2)}%)`,
        recommendation: column.type === 'number' 
          ? 'Fill with mean or median value' 
          : column.type === 'string' && column.mode 
            ? `Fill with most common value: "${column.mode}"` 
            : 'Remove rows or fill with placeholder',
        autoFix: true
      });
    }
  });
  
  // Check for duplicate rows
  if (profile.duplicatePercentage > 0) {
    suggestions.push({
      column: 'Multiple',
      issue: 'duplicate',
      description: `${profile.duplicateRows} duplicate rows (${profile.duplicatePercentage.toFixed(2)}%)`,
      recommendation: 'Remove duplicate rows',
      autoFix: true
    });
  }
  
  // Add more suggestions for outliers and inconsistent data
  profile.columns.filter(col => col.type === 'number').forEach(column => {
    if (column.min !== undefined && column.max !== undefined && column.mean !== undefined) {
      const range = column.max - column.min;
      // Check for potential outliers using IQR or standard deviation
      if (range > 0 && column.max > column.mean * 3) {
        suggestions.push({
          column: column.name,
          issue: 'outlier',
          description: `Potential outliers detected (max value ${column.max} is far from mean ${column.mean?.toFixed(2)})`,
          recommendation: 'Consider capping extreme values or removing outliers',
          autoFix: true
        });
      }
    }
  });
  
  return suggestions;
};

// Clean dataset based on selected suggestions
export const cleanDataset = (
  dataset: DatasetType, 
  profile: DataProfile,
  selectedSuggestions: CleaningSuggestion[]
): DatasetType => {
  let cleanedData = [...dataset.data];
  
  // Process each suggestion
  selectedSuggestions.forEach(suggestion => {
    if (suggestion.issue === 'duplicate' && suggestion.autoFix) {
      // Remove duplicate rows
      const uniqueRows = new Map();
      cleanedData.forEach(row => {
        const key = JSON.stringify(row);
        uniqueRows.set(key, row);
      });
      cleanedData = Array.from(uniqueRows.values());
    }
    
    if (suggestion.issue === 'missing' && suggestion.autoFix) {
      const column = profile.columns.find(col => col.name === suggestion.column);
      if (!column) return;
      
      // Fill missing values based on column type
      cleanedData = cleanedData.map(row => {
        if (row[suggestion.column] === null || row[suggestion.column] === undefined || row[suggestion.column] === '') {
          const newRow = {...row};
          
          if (column.type === 'number' && column.median !== undefined) {
            newRow[suggestion.column] = column.median;
          } else if (column.mode !== undefined) {
            newRow[suggestion.column] = column.mode;
          } else {
            newRow[suggestion.column] = column.type === 'number' ? 0 : 'Unknown';
          }
          
          return newRow;
        }
        return row;
      });
    }
    
    if (suggestion.issue === 'outlier' && suggestion.autoFix) {
      const column = profile.columns.find(col => col.name === suggestion.column);
      if (!column || column.type !== 'number' || column.median === undefined) return;
      
      // Cap extreme values to a reasonable range
      const cap = column.median * 3;
      cleanedData = cleanedData.map(row => {
        if (typeof row[suggestion.column] === 'number' && row[suggestion.column] > cap) {
          return {
            ...row,
            [suggestion.column]: cap
          };
        }
        return row;
      });
    }
  });
  
  return {
    ...dataset,
    data: cleanedData
  };
};

// Convert dataset back to CSV
export const convertToCSV = (dataset: DatasetType): string => {
  return Papa.unparse(dataset.data);
};

// Categorize columns as dimensions or measures
export const categorizeColumns = (profile: DataProfile): { dimensions: string[], measures: string[] } => {
  const dimensions: string[] = [];
  const measures: string[] = [];
  
  profile.columns.forEach(column => {
    if (column.type === 'number') {
      measures.push(column.name);
    } else {
      dimensions.push(column.name);
    }
  });
  
  return { dimensions, measures };
};
