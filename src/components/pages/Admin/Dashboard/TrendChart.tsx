import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendData {
  date: string;
  count: number;
}

type ViewType = 'weekly' | 'monthly' | 'biannual';

interface TrendChartProps {
  data: TrendData[];
  lineColor?: string;
  dataKey?: string;
  viewType?: ViewType;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  lineColor = '#8884d8',
  dataKey = 'count',
  viewType = 'weekly'
}) => {
  const getDateFormat = (view: ViewType) => {
    switch(view) {
      case 'weekly':
        return (value: string) => new Date(value).toLocaleDateString(undefined, { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      case 'monthly':
        return (value: string) => new Date(value).toLocaleDateString(undefined, { 
          year: 'numeric',
          month: 'short'
        });
      case 'biannual':
        return (value: string) => new Date(value).toLocaleDateString(undefined, { 
          year: 'numeric',
          month: 'short'
        });
      default:
        return (value: string) => new Date(value).toLocaleDateString(undefined, { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  };

  const dateFormatter = getDateFormat(viewType);

  // For biannual view, only show every 7th point to reduce density
  const displayData = viewType === 'biannual' 
    ? data.filter((_, index) => index % 7 === 0)
    : data;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={dateFormatter}
              interval={viewType === 'biannual' ? 2 : 'preserveStartEnd'}
            />
            <YAxis />
            <Tooltip
              labelFormatter={dateFormatter}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={lineColor}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;