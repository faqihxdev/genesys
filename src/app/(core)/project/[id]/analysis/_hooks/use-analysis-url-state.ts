import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FunnelOption } from '../types';

interface UseAnalysisUrlStateProps {
  funnels: FunnelOption[] | undefined;
  isFunnelsLoading: boolean;
}

export function useAnalysisUrlState({ funnels, isFunnelsLoading }: UseAnalysisUrlStateProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: projectId } = useParams();

  // Get initial states from URL
  const initialFunnelId = searchParams.get('funnelId');
  const initialSimulationId = searchParams.get('simulationId');
  const initialCompareFunnelId = searchParams.get('compareFunnelId');
  const initialCompareSimulationId = searchParams.get('compareSimulationId');
  const initialComparisonMode = searchParams.get('compare') === 'true';

  // State management
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(initialFunnelId);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(
    initialSimulationId
  );
  const [isComparisonMode, setIsComparisonMode] = useState(initialComparisonMode);
  const [compareFunnelId, setCompareFunnelId] = useState<string | null>(initialCompareFunnelId);
  const [compareSimulationId, setCompareSimulationId] = useState<string | null>(
    initialCompareSimulationId
  );

  // Function to clear URL and reset state
  const resetToCleanState = useCallback(() => {
    // Reset all state
    setSelectedFunnelId(null);
    setSelectedSimulationId(null);
    setIsComparisonMode(false);
    setCompareFunnelId(null);
    setCompareSimulationId(null);

    // Clear URL
    router.replace(`/project/${projectId}/analysis`);

    // Show toast
    toast({
      title: 'Invalid URL Parameters',
      description: 'The URL parameters were invalid and have been reset.',
      variant: 'destructive',
    });
  }, [router, projectId, toast]);

  // Function to validate URL state
  const validateUrlState = useCallback(() => {
    if (!funnels) return false;

    // Check if there are any URL parameters
    const hasUrlParams =
      initialFunnelId ||
      initialSimulationId ||
      initialCompareFunnelId ||
      initialCompareSimulationId;
    if (!hasUrlParams) return true;

    // Validate base funnel
    if (initialFunnelId && !funnels.find((f) => f.id === initialFunnelId)) {
      return false;
    }

    // Validate comparison mode parameters
    if (initialComparisonMode) {
      if (initialCompareFunnelId && !funnels.find((f) => f.id === initialCompareFunnelId)) {
        return false;
      }
    }

    return true;
  }, [
    funnels,
    initialFunnelId,
    initialSimulationId,
    initialCompareFunnelId,
    initialCompareSimulationId,
    initialComparisonMode,
  ]);

  // Validate initial state against available data
  useEffect(() => {
    if (!funnels || isFunnelsLoading) return;

    if (!validateUrlState()) {
      resetToCleanState();
    }
  }, [funnels, isFunnelsLoading, validateUrlState, resetToCleanState]);

  // Function to update URL with current state
  const updateUrlParams = useCallback(
    (params: {
      funnelId?: string | null;
      simulationId?: string | null;
      compareFunnelId?: string | null;
      compareSimulationId?: string | null;
      compare?: boolean;
    }) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Update or remove parameters based on values
      if (params.funnelId) current.set('funnelId', params.funnelId);
      else current.delete('funnelId');

      if (params.simulationId) current.set('simulationId', params.simulationId);
      else current.delete('simulationId');

      if (params.compare) {
        current.set('compare', 'true');
        if (params.compareFunnelId) current.set('compareFunnelId', params.compareFunnelId);
        if (params.compareSimulationId)
          current.set('compareSimulationId', params.compareSimulationId);
      } else {
        current.delete('compare');
        current.delete('compareFunnelId');
        current.delete('compareSimulationId');
      }

      // Update URL without reload
      const query = current.toString();
      router.replace(query ? `?${query}` : '', { scroll: false });
    },
    [router, searchParams]
  );

  // Handle funnel selection
  const handleFunnelSelect = (funnelId: string) => {
    setSelectedFunnelId(funnelId);
    setSelectedSimulationId(null);
    updateUrlParams({ funnelId, simulationId: null, compare: isComparisonMode });
  };

  // Handle simulation selection
  const handleSimulationSelect = (simulationId: string) => {
    setSelectedSimulationId(simulationId);
    updateUrlParams({
      funnelId: selectedFunnelId,
      simulationId,
      compare: isComparisonMode,
      compareFunnelId,
      compareSimulationId,
    });
  };

  // Handle comparison funnel selection
  const handleCompareFunnelSelect = (funnelId: string) => {
    setCompareFunnelId(funnelId);
    setCompareSimulationId(null);
    updateUrlParams({
      funnelId: selectedFunnelId,
      simulationId: selectedSimulationId,
      compareFunnelId: funnelId,
      compareSimulationId: null,
      compare: true,
    });
  };

  // Handle comparison simulation selection
  const handleCompareSimulationSelect = (simulationId: string) => {
    setCompareSimulationId(simulationId);
    updateUrlParams({
      funnelId: selectedFunnelId,
      simulationId: selectedSimulationId,
      compareFunnelId,
      compareSimulationId: simulationId,
      compare: true,
    });
  };

  // Handle comparison mode toggle
  const handleComparisonToggle = (enabled: boolean) => {
    setIsComparisonMode(enabled);
    if (!enabled) {
      setCompareFunnelId(null);
      setCompareSimulationId(null);
      updateUrlParams({
        funnelId: selectedFunnelId,
        simulationId: selectedSimulationId,
        compare: false,
      });
    } else {
      updateUrlParams({
        funnelId: selectedFunnelId,
        simulationId: selectedSimulationId,
        compare: true,
      });
    }
  };

  return {
    // States
    selectedFunnelId,
    selectedSimulationId,
    isComparisonMode,
    compareFunnelId,
    compareSimulationId,

    // Handlers
    handleFunnelSelect,
    handleSimulationSelect,
    handleCompareFunnelSelect,
    handleCompareSimulationSelect,
    handleComparisonToggle,
  };
}
