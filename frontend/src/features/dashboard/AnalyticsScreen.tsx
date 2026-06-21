import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, Database, DollarSign } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1'; // Assuming default fastapi port for standalone requests, or we use our api client

export function AnalyticsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/analytics/daily`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-gray-400 p-6">Loading analytics...</div>;
  if (error) return <div className="text-red-400 p-6">Error: {error}</div>;

  // Extract all unique model IDs for the bar chart
  const modelIds = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key.endsWith('_input') || key.endsWith('_output')) {
        modelIds.add(key.replace('_input', '').replace('_output', ''));
      }
    });
  });

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  const pieData = Array.from(modelIds).map((model, idx) => {
    // this pie data is an approximation if we don't have cost per model in the returned data, 
    // actually our data returns `total_cost` per day, not per model. 
    // Wait, the backend returns:
    // formatted_data[day][f"{model_id}_input"] = row.input
    // formatted_data[day][f"{model_id}_output"] = row.output
    // formatted_data[day]["total_cost"] += row.total_cost
    // It sums total cost per day. If we want pie chart for cost per provider/model, we might need a different endpoint or format.
    // For now, let's just make a pie chart of total tokens per model over the 30 days.
    let totalTokens = 0;
    data.forEach(day => {
      totalTokens += (day[`${model}_input`] || 0) + (day[`${model}_output`] || 0);
    });
    return { name: model, value: totalTokens, color: colors[idx % colors.length] };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="text-emerald-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-100">Analytics Engine</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
            <Database className="mr-2 text-blue-500" size={20}/> 
            Token Usage (30 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
                <Legend />
                {Array.from(modelIds).map((model, idx) => (
                  <Bar key={`${model}_input`} dataKey={`${model}_input`} stackId="a" fill={colors[idx % colors.length]} name={`${model} Input`} />
                ))}
                {Array.from(modelIds).map((model, idx) => (
                  <Bar key={`${model}_output`} dataKey={`${model}_output`} stackId="a" fill={colors[(idx + 2) % colors.length]} name={`${model} Output`} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
            <DollarSign className="mr-2 text-amber-500" size={20}/> 
            Usage Breakdown
          </h3>
          <div className="h-80 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
