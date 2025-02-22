'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeftRight, Download, GitCompare } from 'lucide-react';
import { mockFunnelOptions, mockSimulationOptionsByFunnel } from '../mock-data';

interface AnalysisHeaderProps {
  onFunnelChange: (funnelId: string) => void;
  onSimulationChange: (simulationId: string) => void;
  onComparisonToggle: (enabled: boolean) => void;
  onCompareFunnelChange?: (funnelId: string) => void;
  onCompareSimulationChange?: (simulationId: string) => void;
  isComparisonMode?: boolean;
}

export function AnalysisHeader({
  onFunnelChange,
  onSimulationChange,
  onComparisonToggle,
  onCompareFunnelChange,
  onCompareSimulationChange,
  isComparisonMode,
}: AnalysisHeaderProps) {
  return (
    <div className='space-y-4 bg-card rounded-lg border p-4'>
      {/* Primary Funnel Selection */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-1 items-center gap-4'>
          <Select defaultValue={mockFunnelOptions[0].id} onValueChange={onFunnelChange}>
            <SelectTrigger className='w-[250px] bg-background'>
              <SelectValue placeholder='Select funnel' />
            </SelectTrigger>
            <SelectContent>
              {mockFunnelOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArrowLeftRight className='h-4 w-4 text-muted-foreground' />

          <Select
            defaultValue={mockSimulationOptionsByFunnel[mockFunnelOptions[0].id][0].id}
            onValueChange={onSimulationChange}
          >
            <SelectTrigger className='w-[200px] bg-background'>
              <SelectValue placeholder='Select simulation' />
            </SelectTrigger>
            <SelectContent>
              {mockSimulationOptionsByFunnel[mockFunnelOptions[0].id].map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  Simulation {option.id.split('-').pop()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Switch
              id='comparison-mode'
              checked={isComparisonMode}
              onCheckedChange={onComparisonToggle}
            />
            <label
              htmlFor='comparison-mode'
              className='flex items-center gap-2 text-sm font-medium'
            >
              <GitCompare className='h-4 w-4' />
              Compare
            </label>
          </div>

          <Button variant='outline' size='sm' className='gap-2'>
            <Download className='h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Comparison Funnel Selection */}
      {isComparisonMode && (
        <div className='flex items-center gap-4 pl-8 border-l-2 border-primary/10'>
          <Select defaultValue={mockFunnelOptions[0].id} onValueChange={onCompareFunnelChange}>
            <SelectTrigger className='w-[250px] bg-background'>
              <SelectValue placeholder='Select comparison funnel' />
            </SelectTrigger>
            <SelectContent>
              {mockFunnelOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ArrowLeftRight className='h-4 w-4 text-muted-foreground' />

          <Select
            defaultValue={mockSimulationOptionsByFunnel[mockFunnelOptions[0].id][0].id}
            onValueChange={onCompareSimulationChange}
          >
            <SelectTrigger className='w-[200px] bg-background'>
              <SelectValue placeholder='Select comparison simulation' />
            </SelectTrigger>
            <SelectContent>
              {mockSimulationOptionsByFunnel[mockFunnelOptions[0].id].map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  Simulation {option.id.split('-').pop()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
