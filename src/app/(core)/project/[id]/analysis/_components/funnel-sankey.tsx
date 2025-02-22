'use client';

import { ResponsiveSankey } from '@nivo/sankey';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { SankeyData } from '../types';

interface FunnelSankeyProps {
  data: SankeyData;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

interface SankeyNode {
  id: string;
  name: string;
  type: string;
  value: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

// Tailwind 600 colors for the Sankey diagram
const tailwind600Colors = [
  '#4F46E5', // Violet
  '#2563eb', // Blue
  '#16a34a', // Green
  '#dc2626', // Red
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#c026d3', // Fuchsia
  '#65a30d', // Lime
  '#d97706', // Amber
  '#059669', // Emerald
  '#9333ea', // Purple
  '#0d9488', // Teal
  '#db2777', // Pink
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#ca8a04', // Yellow
  '#e11d48', // Rose
];

/**
 * @description A Sankey diagram component for visualizing funnel flow
 * @param data - The Sankey data containing nodes and links
 * @param height - Optional height of the diagram (default: 300)
 * @param onNodeClick - Optional callback when a node is clicked
 * @param selectedNodeId - Optional ID of the currently selected node
 */
export function FunnelSankey({
  data,
  height = 300,
  onNodeClick,
  selectedNodeId,
}: FunnelSankeyProps) {
  const { theme, systemTheme } = useTheme();

  // Determine if we're in dark mode
  const isDarkMode = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

  // Transform data to use names for display while keeping IDs for reference
  const transformedData = useMemo(() => {
    // Group all drop-off nodes into a single node
    const dropOffNodes = data.nodes.filter((node) => node.name === 'Drop Off');
    const regularNodes = data.nodes.filter((node) => node.name !== 'Drop Off');

    const totalDropOffValue = dropOffNodes.reduce((sum, node) => sum + node.value, 0);
    const dropOffLinks = data.links.filter((link) =>
      dropOffNodes.some((node) => node.id === link.target)
    );

    return {
      nodes: [
        ...regularNodes.map((node) => ({
          ...node,
          nodeId: node.id,
          id: node.name,
        })),
        // Add single drop-off node if there are any drop-offs
        ...(dropOffNodes.length > 0
          ? [
              {
                nodeId: 'drop-off',
                id: 'Drop Off',
                name: 'Drop Off',
                type: 'stage',
                value: totalDropOffValue,
              },
            ]
          : []),
      ],
      links: [
        ...data.links
          .filter((link) => !dropOffNodes.some((node) => node.id === link.target))
          .map((link) => ({
            ...link,
            source: data.nodes.find((n) => n.id === link.source)?.name || link.source,
            target: data.nodes.find((n) => n.id === link.target)?.name || link.target,
          })),
        // Add consolidated drop-off links
        ...dropOffLinks.map((link) => ({
          source: data.nodes.find((n) => n.id === link.source)?.name || link.source,
          target: 'Drop Off',
          value: link.value,
        })),
      ],
    };
  }, [data]);

  // Calculate total value for conversion rate
  const totalValue = useMemo(() => {
    const rootNodes = data.nodes.filter(
      (node) => !data.links.some((link) => link.target === node.id)
    );
    return rootNodes.reduce((sum, node) => sum + node.value, 0);
  }, [data]);

  // Custom color function to make Drop Off node gray
  const getNodeColor = (node: { id: string }) => {
    if (node.id === 'Drop Off') {
      return isDarkMode ? '#4b5563' : '#6b7280'; // Gray-600/500
    }
    const index = transformedData.nodes.findIndex((n) => n.id === node.id);
    return tailwind600Colors[index % tailwind600Colors.length];
  };

  // Memoize the theme config to prevent unnecessary re-renders
  const themeConfig = useMemo(
    () => ({
      background: 'transparent',
      textColor: isDarkMode ? '#e1e7ef' : '#475569',
      fontSize: 12,
      tooltip: {
        container: {
          background: isDarkMode ? '#020617' : '#ffffff', // slate-950/white
          color: isDarkMode ? '#e1e7ef' : '#475569',
          fontSize: '12px',
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', // slate-800/200
        },
      },
      nodes: {
        hover: {
          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
        },
      },
    }),
    [isDarkMode]
  );

  return (
    <div
      style={{ height }}
      className='[&_g[transform]:hover]:bg-slate-100 dark:[&_g[transform]:hover]:bg-slate-800'
    >
      <ResponsiveSankey<SankeyNode, SankeyLink>
        data={transformedData}
        margin={{ top: 20, right: 100, bottom: 20, left: 100 }}
        align='justify'
        colors={getNodeColor}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={2}
        nodeBorderColor={(node) =>
          data.nodes.find((n) => n.name === node.id)?.id === selectedNodeId
            ? isDarkMode
              ? '#e1e7ef'
              : '#475569'
            : 'transparent'
        }
        nodeBorderRadius={3}
        linkOpacity={isDarkMode ? 0.25 : 0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        linkBlendMode={isDarkMode ? 'lighten' : 'multiply'}
        labelPosition='outside'
        labelOrientation='horizontal'
        labelPadding={16}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1]],
        }}
        theme={themeConfig}
        animate={true}
        motionConfig='gentle'
        onClick={(node) => {
          if ('id' in node) {
            // Find the original node ID from the name
            const originalNode = data.nodes.find((n) => n.name === node.id);
            if (originalNode) {
              onNodeClick?.(originalNode.id);
            }
          }
        }}
        nodeTooltip={({ node }) => {
          // Find initial node (node with no incoming links)
          const initialNode = transformedData.nodes.find(
            (n) => !transformedData.links.some((link) => link.target === n.id)
          );
          const initialValue = initialNode?.value || 0;

          // Calculate incoming value (sum of incoming links)
          const incomingValue = transformedData.links
            .filter((link) => link.target === node.id)
            .reduce((sum, link) => sum + link.value, 0);

          // Calculate outgoing value (sum of outgoing links excluding Drop Off)
          const outgoingValue = transformedData.links
            .filter((link) => link.source === node.id && link.target !== 'Drop Off')
            .reduce((sum, link) => sum + link.value, 0);

          // Check if this is an end node (no outgoing links or only to Drop Off)
          const isEndNode = !transformedData.links.some(
            (link) => link.source === node.id && link.target !== 'Drop Off'
          );

          // Calculate conversion rate based on node type
          const conversionRate = isEndNode
            ? ((node.value / initialValue) * 100).toFixed(1) // End nodes: relative to initial node
            : incomingValue > 0
              ? ((outgoingValue / incomingValue) * 100).toFixed(1) // Middle nodes: relative to incoming
              : ((outgoingValue / node.value) * 100).toFixed(1); // Initial node: outgoing vs total value

          return (
            <div className='flex flex-col gap-1 bg-background border border-border rounded-md p-3 shadow-md'>
              <strong className='text-sm'>{node.id}</strong>
              <div className='flex items-baseline gap-1 text-xs'>
                <span>Stage Conversion:</span>
                <span className='font-medium'>{conversionRate}%</span>
              </div>
              <div className='flex items-baseline gap-1 text-xs'>
                <span>Value:</span>
                <span className='font-medium'>{node.value}</span>
              </div>
              {(incomingValue > 0 || (!incomingValue && node.value > outgoingValue)) && (
                <div className='flex items-baseline gap-1 text-xs'>
                  <span>Drop Off:</span>
                  <span className='font-medium'>{(node.value - outgoingValue).toFixed(0)}</span>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
