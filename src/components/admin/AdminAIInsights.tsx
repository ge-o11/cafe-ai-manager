import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  todayStats: {
    totalOrders: number;
    totalRevenue: number;
    top5: { name: string; count: number; revenue: number }[];
    bottom5: { name: string; count: number; revenue: number }[];
  } | null;
  weeklyStats: {
    salesByDay: { day: string; revenue: number }[];
    salesByHour: { hour: string; orders: number }[];
    salesByCategory: { name: string; value: number }[];
  } | null;
}

const AdminAIInsights: React.FC<Props> = ({ todayStats, weeklyStats }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze the following restaurant sales data and provide actionable insights:

TODAY:
- Total orders: ${todayStats?.totalOrders ?? 0}
- Total revenue: ₪${todayStats?.totalRevenue.toFixed(2) ?? '0'}
- Top sellers: ${JSON.stringify(todayStats?.top5 ?? [])}
- Least sold: ${JSON.stringify(todayStats?.bottom5 ?? [])}

LAST 7 DAYS:
- Revenue by day: ${JSON.stringify(weeklyStats?.salesByDay ?? [])}
- Orders by hour: ${JSON.stringify(weeklyStats?.salesByHour ?? [])}
- Sales by category: ${JSON.stringify(weeklyStats?.salesByCategory ?? [])}

Provide:
1. Best selling items analysis
2. Low performing items and suggestions
3. Busy hours analysis
4. 3 specific promotion ideas
5. Menu improvement suggestions

Keep it concise and actionable. Use emojis. Respond in English.`;

      const { data, error } = await supabase.functions.invoke('ai-menu-chat', {
        body: { message: prompt, conversationHistory: [] },
      });

      if (error) throw error;
      setInsights(data.response);
    } catch (err) {
      console.error('AI insights error:', err);
      setInsights('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <div className="text-center py-4">
        <Button onClick={generateInsights} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate AI Insights
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Analyzing sales data...
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <ReactMarkdown>{insights}</ReactMarkdown>
      <Button onClick={generateInsights} variant="ghost" size="sm" className="mt-4 gap-1">
        <Sparkles className="w-3 h-3" /> Regenerate
      </Button>
    </div>
  );
};

export default AdminAIInsights;
