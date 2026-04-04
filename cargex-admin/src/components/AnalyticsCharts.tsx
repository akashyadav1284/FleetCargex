"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsCharts({ data, period }: { data: any, period: string }) {
  const revenueChartData = data.revenueData?.map((d: any) => {
    let name = '';
    if (period === 'daily') name = `${d._id.month}/${d._id.day}`;
    else if (period === 'weekly') name = `Wk ${d._id.week}`;
    else name = `${d._id.year}-${String(d._id.month).padStart(2, '0')}`;
    return { name, Revenue: d.revenue, Rides: d.rides };
  }) || [];

  const vehicleChartData = data.vehicleBreakdown?.map((d: any) => ({ name: d._id || 'Unknown', value: d.count })) || [];
  const peakChartData = data.peakHours?.map((d: any) => ({ hour: `${d._id}:00`, count: d.count })) || [];
  const statusChartData = data.statusBreakdown?.map((d: any) => ({ name: d._id, value: d.count })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Revenue Over Time Line Chart */}
      <div className="card col-span-1 lg:col-span-2 space-y-4">
        <h2 className="font-bold text-lg">Revenue & Rides Trend</h2>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3039" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3039', borderRadius: '8px', color: '#F9FAFB' }}
                itemStyle={{ fontSize: '14px', fontWeight: 'bold' }} 
              />
              <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="Rides" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle Popularity Bar Chart */}
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">Completed Rides by Vehicle Type</h2>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleChartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3039" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#22252F' }} contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3039', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours Area/Bar Chart */}
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">Peak Commute Hours (Last 30 Days)</h2>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakChartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3039" vertical={false} />
              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#22252F' }} contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3039', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">Booking Status Breakdown</h2>
        <div className="w-full h-[250px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusChartData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {statusChartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={
                    entry.name === 'completed' ? '#10B981' : 
                    entry.name === 'cancelled' ? '#EF4444' : 
                    entry.name === 'in_progress' ? '#3B82F6' : 
                    '#F59E0B'
                  } />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2D3039', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
