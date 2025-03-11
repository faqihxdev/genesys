'use client';

import { PageTitle } from '@/components/custom/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { getFunnelSimulations, getProjectFunnelsWithSimulations } from '@/server/analysis';
import { getFunnelsWithFullData } from '@/server/funnel';
import { getPersonaConfigsByProject } from '@/server/persona';
import { getProjectById } from '@/server/projects';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart, Calendar, Eye, LineChart, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Project overview page
 * Shows project details and key metrics
 */
export default function OverviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: queryKey.projects.getProjectById({ projectId }),
    queryFn: () => withQuery(getProjectById)({ projectId }),
  });

  // Fetch persona configs
  const { data: personaConfigs = [] } = useQuery({
    queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
    queryFn: () => withQuery(getPersonaConfigsByProject)({ projectId }),
  });

  // Fetch funnels
  const { data: funnels = [] } = useQuery({
    queryKey: queryKey.funnel.all(projectId),
    queryFn: () => withQuery(getFunnelsWithFullData)({ projectId }),
  });

  // Fetch funnels with simulations
  const { data: funnelsWithSimulations = [] } = useQuery({
    queryKey: queryKey.simulation.getProjectFunnelsWithSimulations({ projectId }),
    queryFn: () => withQuery(getProjectFunnelsWithSimulations)({ projectId }),
  });

  // Get recent simulations for all funnels with simulations
  const { data: recentSimulations = [] } = useQuery({
    queryKey: ['recent-simulations', projectId],
    queryFn: async () => {
      if (!funnelsWithSimulations || funnelsWithSimulations.length === 0) return [];

      const simulationPromises = funnelsWithSimulations.map(async (funnel) => {
        try {
          const result = await withQuery(getFunnelSimulations)({ funnelId: funnel.id });
          return (result || []).map((sim) => ({
            ...sim,
            funnelId: funnel.id,
            funnelName: funnel.name,
          }));
        } catch (error) {
          console.error(
            `[OverviewPage]: Error fetching simulations for funnel ${funnel.id}:`,
            error
          );
          return [];
        }
      });

      const simulationsArrays = await Promise.all(simulationPromises);
      return simulationsArrays
        .flat()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5); // Get the 5 most recent simulations
    },
    enabled: !!funnelsWithSimulations && funnelsWithSimulations.length > 0,
  });

  if (!project) {
    return null; // or a loading state / error state component
  }

  // Calculate total personas across all configs
  const totalPersonas = personaConfigs?.reduce((sum, config) => sum + config.personaCount, 0) || 0;

  // Calculate total simulations count
  const totalSimulations =
    funnelsWithSimulations?.reduce((sum, funnel) => sum + Number(funnel.simulationCount), 0) || 0;

  // Get date of last simulation
  const lastSimulationDate = funnelsWithSimulations?.length
    ? new Date(Math.max(...funnelsWithSimulations.map((f) => new Date(f.lastSimulated).getTime())))
    : null;

  // Mock data for charts (replace with real data when available)
  const conversionData = [
    { name: 'Landing', value: 100 },
    { name: 'Product', value: 78 },
    { name: 'Checkout', value: 52 },
    { name: 'Payment', value: 37 },
    { name: 'Confirm', value: 33 },
  ];

  return (
    <div className='pb-8 space-y-6 animate-in fade-in-50'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title={`${project.name} Project Overview`}
          description={project.description || 'No description provided for this project.'}
        />
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Calendar className='mr-2 h-4 w-4' />
            {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'No date'}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='default' size='sm' asChild>
                  <Link href={`/project/${project.id}/analysis`}>
                    <Eye className='h-4 w-4' />
                    View Analysis
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View detailed analytics and insights</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* Total Personas */}
        <section className='border rounded-lg bg-card shadow-sm'>
          <div className='pb-2 px-8 pt-6 flex flex-row relative items-center justify-between'>
            <h3 className='text-sm font-medium text-muted-foreground'>Total Personas</h3>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 absolute top-4 right-4'
              asChild
            >
              <Link href={`/project/${project.id}/persona`}>
                <ArrowUpRight className='h-4 w-4' />
              </Link>
            </Button>
          </div>
          <div className='px-8 pt-0 pb-8'>
            <div className='text-3xl font-bold'>{totalPersonas.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Across {personaConfigs?.length || 0} configuration
              {(personaConfigs?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </section>

        {/* Active Funnels */}
        <section className='border rounded-lg bg-card shadow-sm'>
          <div className='pb-2 px-8 pt-6 flex flex-row relative items-center justify-between'>
            <h3 className='text-sm font-medium text-muted-foreground'>Active Funnels</h3>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 absolute top-4 right-4'
              asChild
            >
              <Link href={`/project/${project.id}/funnels`}>
                <ArrowUpRight className='h-4 w-4' />
              </Link>
            </Button>
          </div>
          <div className='px-8 pt-0 pb-8'>
            <div className='text-3xl font-bold'>{funnels?.length.toLocaleString() || 0}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {funnelsWithSimulations?.length || 0} with simulations
            </p>
          </div>
        </section>

        {/* Simulations Run */}
        <section className='border rounded-lg bg-card shadow-sm'>
          <div className='pb-2 px-8 pt-6 flex flex-row relative items-center justify-between'>
            <h3 className='text-sm font-medium text-muted-foreground'>Simulations Run</h3>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0 absolute top-4 right-4'
              asChild
            >
              <Link href={`/project/${project.id}/analysis`}>
                <ArrowUpRight className='h-4 w-4' />
              </Link>
            </Button>
          </div>
          <div className='px-8 pt-0 pb-8'>
            <div className='text-3xl font-bold'>{totalSimulations.toLocaleString()}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {lastSimulationDate
                ? `Last simulation: ${lastSimulationDate.toLocaleDateString()}`
                : 'No simulations yet'}
            </p>
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className='border rounded-lg bg-card shadow-sm'>
        <div className='p-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold'>Quick Actions</h2>
              <p className='text-sm text-muted-foreground'>Get started with your project</p>
            </div>
            <div className='flex items-center justify-end gap-4 grow'>
              <Button
                variant='outline'
                className='h-auto py-4 shadow-sm hover:shadow-md transition-all'
                asChild
              >
                <Link href={`/project/${project.id}/persona`}>
                  <div className='flex items-center gap-2'>
                    <Users className='h-6 w-6 text-primary' />
                    <div className='text-sm font-medium'>Create Personas</div>
                  </div>
                </Link>
              </Button>
              <Button
                variant='outline'
                className='h-auto py-4 shadow-sm hover:shadow-md transition-all'
                asChild
              >
                <Link href={`/project/${project.id}/funnels`}>
                  <div className='flex items-center gap-2'>
                    <ArrowUpRight className='h-6 w-6 text-primary' />
                    <div className='text-sm font-medium'>Build Funnel</div>
                  </div>
                </Link>
              </Button>
              <Button
                variant='outline'
                className='h-auto py-4 shadow-sm hover:shadow-md transition-all'
                asChild
              >
                <Link href={`/project/${project.id}/settings`}>
                  <div className='flex items-center gap-2'>
                    <Settings className='h-6 w-6 text-primary' />
                    <div className='text-sm font-medium'>Settings</div>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Project Funnels and Persona Configurations side by side */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Project Funnels */}
        <section className='border rounded-lg bg-card shadow-sm flex flex-col'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold'>Project Funnels</h2>
            <p className='text-sm text-muted-foreground'>All marketing funnels in this project</p>
          </div>
          <div className='p-6 pt-0 grow overflow-auto'>
            {funnels && funnels.length > 0 ? (
              <div className='space-y-4'>
                {funnels.map((funnel) => {
                  const funnelWithSimulations = funnelsWithSimulations?.find(
                    (f) => f.id === funnel.id
                  );
                  const simulationCount = funnelWithSimulations
                    ? Number(funnelWithSimulations.simulationCount)
                    : 0;
                  return (
                    <div
                      key={funnel.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center'>
                          <ArrowUpRight className='w-5 h-5 text-primary' />
                        </div>
                        <div>
                          <h4 className='text-sm font-medium'>{funnel.name}</h4>
                          <p className='text-xs text-muted-foreground'>
                            {funnel.stages.length} stage{funnel.stages.length !== 1 ? 's' : ''}
                            {simulationCount > 0 &&
                              ` • ${simulationCount} simulation${simulationCount !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        {simulationCount > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant='outline' size='sm' asChild>
                                  <Link href={`/project/${project.id}/funnel/${funnel.id}`}>
                                    <ArrowUpRight className='h-4 w-4' />
                                    View
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View funnel</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-12'>
                <ArrowUpRight className='w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20' />
                <h3 className='text-lg font-medium'>No funnels created yet</h3>
                <p className='text-muted-foreground mb-4'>
                  Create your first marketing funnel to start analyzing
                </p>
                <Button asChild>
                  <Link href={`/project/${project.id}/funnel`}>Create Funnel</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Persona Configurations */}
        <section className='border rounded-lg bg-card shadow-sm flex flex-col'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold'>Persona Configurations</h2>
            <p className='text-sm text-muted-foreground'>All persona sets in this project</p>
          </div>
          <div className='p-6 pt-0 grow overflow-auto'>
            {personaConfigs && personaConfigs.length > 0 ? (
              <div className='space-y-4'>
                {personaConfigs.map((config) => (
                  <div
                    key={config.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center'>
                        <Users className='w-5 h-5 text-primary' />
                      </div>
                      <div>
                        <h4 className='text-sm font-medium'>{config.name}</h4>
                        <p className='text-xs text-muted-foreground'>
                          {config.personaCount} of {config.size} personas generated
                        </p>
                      </div>
                    </div>
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/project/${project.id}/persona`}>
                        <ArrowUpRight className='h-4 w-4' />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <Users className='w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20' />
                <h3 className='text-lg font-medium'>No persona configurations yet</h3>
                <p className='text-muted-foreground mb-4'>
                  Create your first persona set to start simulations
                </p>
                <Button asChild>
                  <Link href={`/project/${project.id}/persona/new`}>Create Personas</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Data visualization section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Conversion Performance */}
        <section className='border rounded-lg bg-card shadow-sm flex flex-col'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold'>Conversion Performance</h2>
            <p className='text-sm text-muted-foreground'>
              Average funnel performance across simulations
            </p>
          </div>
          <div className='p-6 pt-0 grow'>
            {totalSimulations > 0 ? (
              <ChartContainer
                config={{
                  conversion: {
                    label: 'Conversion',
                    theme: {
                      light: 'hsl(var(--primary))',
                      dark: 'hsl(var(--primary))',
                    },
                  },
                }}
              >
                <div>
                  {/* Using a div with recharts implementation would go here in a real scenario */}
                  <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                    Graph showing conversion decline from {conversionData[0].value}% to{' '}
                    {conversionData[conversionData.length - 1].value}%
                  </div>
                </div>
              </ChartContainer>
            ) : (
              <div className='flex h-full items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                  <LineChart className='w-12 h-12 mx-auto mb-2 opacity-20' />
                  <p>No conversion data available</p>
                  <p className='text-sm'>Run simulations to see this chart</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent Simulations */}
        <section className='border rounded-lg bg-card shadow-sm flex flex-col'>
          <div className='p-6'>
            <h2 className='text-lg font-semibold'>Recent Simulations</h2>
            <p className='text-sm text-muted-foreground'>
              Latest simulation runs across all funnels
            </p>
          </div>
          <div className='p-6 pt-0 grow'>
            {recentSimulations.length > 0 ? (
              <div className='space-y-4'>
                {recentSimulations.map((simulation) => (
                  <div
                    key={simulation.id}
                    className='flex items-center gap-3 p-3 border rounded-lg'
                  >
                    <div className='shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                      <BarChart className='w-4 h-4 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium leading-none truncate'>
                        {simulation.funnelName}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge
                          variant={
                            simulation.status === 'complete'
                              ? 'default'
                              : simulation.status === 'processing'
                                ? 'outline'
                                : 'secondary'
                          }
                          className='text-xs'
                        >
                          {simulation.status}
                        </Badge>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(simulation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant='outline' size='sm' asChild>
                            <Link
                              href={`/project/${project.id}/analysis?fid=${simulation.funnelId}&sid=${simulation.id}`}
                            >
                              <ArrowUpRight className='h-4 w-4' />
                              View
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View simulation analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-[180px]'>
                <div className='text-center text-muted-foreground'>
                  <BarChart className='w-12 h-12 mx-auto mb-2 opacity-20' />
                  <p>No simulations run yet</p>
                  <p className='text-sm'>Start a simulation to see results</p>
                </div>
              </div>
            )}
          </div>
          {recentSimulations.length > 0 && (
            <div className='px-6 py-4 text-center'>
              <Button variant='ghost' size='sm' className='w-full' asChild>
                <Link href={`/project/${project.id}/analysis`}>View all simulations</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
