import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { KPIMetric } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  metric: KPIMetric;
  className?: string;
}

const StatsCard = ({ metric, className }: StatsCardProps) => {
  return (
    <Card className={cn("shadow-card hover:shadow-elevated transition-shadow", className)}>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-2xl font-heading font-bold text-foreground">{metric.value}</p>
          {metric.change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              metric.trend === 'up' && "bg-success/10 text-success",
              metric.trend === 'down' && "bg-destructive/10 text-destructive",
              metric.trend === 'stable' && "bg-muted text-muted-foreground"
            )}>
              {metric.trend === 'up' && <TrendingUp size={12} />}
              {metric.trend === 'down' && <TrendingDown size={12} />}
              {metric.trend === 'stable' && <Minus size={12} />}
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
