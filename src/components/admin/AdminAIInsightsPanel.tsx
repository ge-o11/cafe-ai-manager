import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Sparkles, TrendingUp,
  Tag, Gift, ImageIcon, Download, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_items: { name_he: string; name_en: string; category_id: string };
}

interface Order {
  id: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

interface Recommendation {
  title: string;
  body: string;
  promoIdea: string;
}

interface WeeklyPromotion {
  title: string;
  description: string;
  discount: string;
  targetItems: string[];
  bestDays: string;
  imagePrompt: string;
}

interface InsightsResult {
  recommendations: Recommendation[];
  weeklyPromotion: WeeklyPromotion | null;
}

const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// ─── Stats ────────────────────────────────────────────────────────────────────

function computeStats(currentOrders: Order[], prevOrders: Order[]) {
  const calcBase = (orders: Order[]) => {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrderValue };
  };

  const current = calcBase(currentOrders);
  const previous = calcBase(prevOrders);

  const productMap: Record<string, { name_he: string; units: number; revenue: number }> = {};
  for (const order of currentOrders) {
    for (const oi of order.order_items) {
      const key = oi.menu_items.name_he || oi.menu_items.name_en;
      if (!productMap[key]) productMap[key] = { name_he: key, units: 0, revenue: 0 };
      productMap[key].units += oi.quantity;
      productMap[key].revenue += oi.quantity * oi.unit_price;
    }
  }
  const products = Object.values(productMap).sort((a, b) => b.units - a.units);
  const top5 = products.slice(0, 5).map(p => ({
    name_he: p.name_he,
    units: p.units,
    revenue: Math.round(p.revenue),
  }));
  const bottom5 = products
    .filter(p => p.units >= 2)
    .slice(-5)
    .reverse()
    .map(p => ({ name_he: p.name_he, units: p.units }));

  const dayRevMap: Record<number, number> = {};
  for (let d = 0; d < 7; d++) dayRevMap[d] = 0;
  for (const order of currentOrders) {
    dayRevMap[new Date(order.created_at).getDay()] += Number(order.total_price);
  }
  const revenueByDay = DAY_NAMES_HE.map((name, i) => ({ day: name, revenue: Math.round(dayRevMap[i]) }));

  const hourMap: Record<number, number> = {};
  for (let h = 6; h <= 23; h++) hourMap[h] = 0;
  for (const order of currentOrders) {
    const h = new Date(order.created_at).getHours();
    if (h >= 6 && h <= 23) hourMap[h]++;
  }
  const revenueByHour = Object.entries(hourMap).map(([h, orders]) => ({ hour: `${h}:00`, orders }));

  const catMap: Record<string, number> = {};
  for (const order of currentOrders) {
    for (const oi of order.order_items) {
      const cat = oi.menu_items.category_id;
      catMap[cat] = (catMap[cat] || 0) + oi.quantity * oi.unit_price;
    }
  }
  const totalCatRev = Object.values(catMap).reduce((s, v) => s + v, 0);
  const categoryBreakdown = Object.entries(catMap).map(([catId, revenue]) => ({
    name_he: catId,
    revenue: Math.round(revenue),
    pct: totalCatRev > 0 ? Math.round((revenue / totalCatRev) * 100) : 0,
  }));

  return {
    current: {
      totalRevenue: Math.round(current.totalRevenue),
      totalOrders: current.totalOrders,
      avgOrderValue: Math.round(current.avgOrderValue),
    },
    previous: {
      totalRevenue: Math.round(previous.totalRevenue),
      totalOrders: previous.totalOrders,
      avgOrderValue: Math.round(previous.avgOrderValue),
    },
    top5Products: top5,
    bottom5Products: bottom5,
    revenueByDay,
    revenueByHour,
    categoryBreakdown,
  };
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

const CARD_COLORS = [
  'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
  'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
  'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20',
  'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
];

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <Card className={`border-l-4 ${CARD_COLORS[index % CARD_COLORS.length]} shadow-sm`}>
      <CardContent className="pt-5 pb-5 px-5 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{index + 1}</span>
          </div>
          <h3 className="font-bold text-foreground text-base leading-snug">{rec.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pr-9">{rec.body}</p>
        {rec.promoIdea && (
          <div className="pr-9">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-dashed border-orange-300 dark:border-orange-700">
              <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">{rec.promoIdea}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Weekly Promo Card ────────────────────────────────────────────────────────

function WeeklyPromoCard({
  promo, onGenerateImage, generatingImage, promoImage,
}: {
  promo: WeeklyPromotion;
  onGenerateImage: () => void;
  generatingImage: boolean;
  promoImage: string | null;
}) {
  const handleDownload = () => {
    if (!promoImage) return;
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const grad = ctx.createLinearGradient(0, size * 0.4, 0, size);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.82)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '500 32px Arial';
      ctx.fillText(promo.bestDays, size - 40, size - 180);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Arial';
      const words = promo.title.split(' ');
      let line = '';
      let y = size - 120;
      for (const word of words) {
        const test = line ? `${word} ${line}` : word;
        if (ctx.measureText(test).width > size - 80 && line) {
          ctx.fillText(line, size - 40, y);
          y -= 72;
          line = word;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, size - 40, y);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 44px Arial';
      const badgeW = ctx.measureText(promo.discount).width + 60;
      ctx.beginPath();
      ctx.roundRect(40, size - 120, badgeW, 60, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(promo.discount, 70, size - 75);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'mivtza-hashavua.png';
      link.click();
    };
    img.src = `data:image/png;base64,${promoImage}`;
  };

  return (
    <Card className="border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base text-amber-900 dark:text-amber-300">מבצע השבוע</CardTitle>
            <p className="text-xs text-amber-700 dark:text-amber-500">המלצת AI מבוססת נתונים</p>
          </div>
          <Badge className="mr-auto bg-amber-500 hover:bg-amber-500 text-white text-xs">חם 🔥</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-1">{promo.title}</h3>
          <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">{promo.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-muted-foreground mb-1">הנחה / הטבה</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{promo.discount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-muted-foreground mb-1">ימים מומלצים</p>
            <p className="font-bold text-foreground text-sm">{promo.bestDays}</p>
          </div>
        </div>
        {Array.isArray(promo.targetItems) && promo.targetItems.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">מוצרים במבצע</p>
            <div className="flex flex-wrap gap-2">
              {promo.targetItems.map((item, i) => (
                <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="pt-1 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            תמונה לפרסום ברשתות חברתיות
          </p>
          {promoImage ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden shadow-md">
                <img src={`data:image/png;base64,${promoImage}`} alt="תמונת מבצע" className="w-full block" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-right">
                  <p className="text-white/80 text-sm font-medium mb-1">{promo.bestDays}</p>
                  <h3 className="text-white text-2xl font-black leading-tight mb-2 drop-shadow-lg">{promo.title}</h3>
                  <div className="inline-flex self-end bg-amber-500 text-white font-bold text-lg px-4 py-1.5 rounded-full shadow-lg">
                    {promo.discount}
                  </div>
                </div>
              </div>
              <Button onClick={handleDownload} className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                <Download className="w-4 h-4" />
                הורד תמונה לפרסום
              </Button>
            </div>
          ) : (
            <Button
              onClick={onGenerateImage}
              disabled={generatingImage}
              variant="outline"
              className="w-full gap-2 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              {generatingImage ? (
                <><Loader2 className="w-4 h-4 animate-spin" />מייצר תמונה...</>
              ) : (
                <><Sparkles className="w-4 h-4" />צור תמונה לפרסום</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

const AdminAIInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [legacyText, setLegacyText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [promoImage, setPromoImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { now, currentStart, prevStart } = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - 7);
    const prevStart = new Date(now);
    prevStart.setDate(now.getDate() - 14);
    return { now, currentStart, prevStart };
  }, []);

  const { data: currentOrders = [], isLoading: loadingCurrent } = useQuery<Order[]>({
    queryKey: ['insights-current', currentStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, total_price, created_at,
          order_items (id, quantity, unit_price,
            menu_items (name_he, name_en, category_id))`)
        .neq('status', 'cancelled')
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', now.toISOString());
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: prevOrders = [], isLoading: loadingPrev } = useQuery<Order[]>({
    queryKey: ['insights-prev', prevStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, total_price, created_at,
          order_items (id, quantity, unit_price,
            menu_items (name_he, name_en, category_id))`)
        .neq('status', 'cancelled')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', currentStart.toISOString());
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setInsights(null);
    setLegacyText(null);
    setPromoImage(null);
    setImageError(null);
    try {
      const stats = computeStats(currentOrders, prevOrders);
      const { data, error } = await supabase.functions.invoke('ai-sales-insights', { body: { stats } });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      if (Array.isArray(data?.recommendations)) {
        const promo = data?.weeklyPromotion && typeof data.weeklyPromotion === 'object'
          ? { ...data.weeklyPromotion, targetItems: Array.isArray(data.weeklyPromotion.targetItems) ? data.weeklyPromotion.targetItems : [] }
          : null;
        setInsights({ recommendations: data.recommendations, weeklyPromotion: promo });
      } else if (typeof data?.recommendations === 'string') {
        setLegacyText(data.recommendations);
      } else {
        throw new Error('פורמט תשובה לא מוכר מה-AI');
      }
    } catch (err: unknown) {
      console.error('AI insights error:', err);
      setGenError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!insights?.weeklyPromotion?.imagePrompt) return;
    setGeneratingImage(true);
    setImageError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sales-insights', {
        body: { imagePrompt: insights.weeklyPromotion.imagePrompt },
      });
      if (error) throw error;
      if (data?.imageBase64) {
        setPromoImage(data.imageBase64);
      } else {
        throw new Error(data?.error || 'לא התקבלה תמונה');
      }
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'שגיאה ביצירת תמונה');
    } finally {
      setGeneratingImage(false);
    }
  };

  const dataLoading = loadingCurrent || loadingPrev;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const stats = computeStats(currentOrders, prevOrders);
  const revChange = stats.previous.totalRevenue > 0
    ? Math.round(((stats.current.totalRevenue - stats.previous.totalRevenue) / stats.previous.totalRevenue) * 100)
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium">הכנסה השבוע</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-foreground">₪{stats.current.totalRevenue.toLocaleString()}</p>
            {revChange !== null && (
              <p className={`text-xs mt-0.5 flex items-center gap-1 ${revChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <TrendingUp className="w-3 h-3" />
                {revChange >= 0 ? '+' : ''}{revChange}% לעומת שבוע שעבר
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium">הזמנות</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-foreground">{stats.current.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">ממוצע ₪{stats.current.avgOrderValue} להזמנה</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium">מוצר מוביל</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.top5Products[0] ? (
              <>
                <p className="text-lg font-bold text-foreground leading-tight">{stats.top5Products[0].name_he}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats.top5Products[0].units} יחידות · ₪{stats.top5Products[0].revenue}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">אין נתונים</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />מנתח נתונים...</>
          ) : (
            <><Sparkles className="w-4 h-4" />{insights ? 'רענן המלצות' : 'צור המלצות AI + מבצע'}</>
          )}
        </Button>
      </div>

      {/* Error */}
      {genError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="py-4 px-4 text-sm text-red-700 dark:text-red-400">
            שגיאה: {genError}
          </CardContent>
        </Card>
      )}

      {/* Legacy format */}
      {legacyText && (
        <Card className="bg-white dark:bg-card border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-purple-500" />
              המלצות לשיפור העסק
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{legacyText}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {insights && (
        <div className="space-y-8">
          {insights.weeklyPromotion && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-foreground text-lg">מבצע השבוע</h2>
              </div>
              <WeeklyPromoCard
                promo={insights.weeklyPromotion}
                onGenerateImage={handleGenerateImage}
                generatingImage={generatingImage}
                promoImage={promoImage}
              />
              {imageError && <p className="text-xs text-red-500 text-center">{imageError}</p>}
            </section>
          )}

          {insights.recommendations.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold text-foreground text-lg">המלצות לשיפור העסק</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {insights.recommendations.length} המלצות
                </span>
              </div>
              <div className="space-y-3">
                {insights.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAIInsightsPanel;
