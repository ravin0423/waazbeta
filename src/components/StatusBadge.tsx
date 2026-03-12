import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  submitted: 'bg-info/10 text-info border-info/20',
  in_review: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  in_repair: 'bg-info/10 text-info border-info/20',
  completed: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  open: 'bg-info/10 text-info border-info/20',
  in_progress: 'bg-warning/10 text-warning border-warning/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground border-border',
  paid: 'bg-success/10 text-success border-success/20',
  overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-border',
  confirmed: 'bg-info/10 text-info border-info/20',
  received: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const colorClass = statusColors[status] || 'bg-muted text-muted-foreground border-border';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Badge variant="outline" className={cn("font-medium capitalize", colorClass, className)}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
