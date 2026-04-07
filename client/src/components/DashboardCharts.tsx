import { useMemo } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface ValidationTrendData {
  date: string;
  success: number;
  invalid: number;
  expired: number;
  banned: number;
  paused: number;
}

interface KeyStatusDistribution {
  status: string;
  count: number;
}

interface DashboardChartsProps {
  validationTrend?: ValidationTrendData[];
  keyStatusDistribution?: KeyStatusDistribution[];
  isLoading?: boolean;
}

export function ValidationTrendChart({ data, isLoading }: { data?: ValidationTrendData[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tendência de Validações (7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tendência de Validações (7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tendência de Validações (7 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="invalid" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="expired" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="banned" stroke="#ec4899" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function KeyStatusDistributionChart({ data, isLoading }: { data?: KeyStatusDistribution[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Distribuição de Status das Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Distribuição de Status das Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Distribuição de Status das Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, count }) => `${status}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              labelStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({ validationTrend, keyStatusDistribution, isLoading }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ValidationTrendChart data={validationTrend} isLoading={isLoading} />
      <KeyStatusDistributionChart data={keyStatusDistribution} isLoading={isLoading} />
    </div>
  );
}
