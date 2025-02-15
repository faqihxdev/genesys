import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

interface PageTitleProps {
  title: string;
  description: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className='flex items-center gap-1'>
      <h1 className='text-2xl font-semibold'>{title}</h1>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            className='group cursor-help p-1 rounded-full transition-all duration-150 hover:bg-muted-foreground/10'
            aria-label='Show more information'
          >
            <Info className='h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-150' />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side='right'
          align='start'
          sideOffset={4}
          className='text-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        >
          {description}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
