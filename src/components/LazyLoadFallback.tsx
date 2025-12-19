import { Loader2 } from 'lucide-react';

export const LazyLoadFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px] py-8">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
};
