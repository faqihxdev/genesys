'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PersonaConfigForm from './_new-config';

// Mock data for demonstration purposes
interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  size: number;
  type: 'preset' | 'custom';
  createdAt: Date;
}

const mockPersonaConfigs: PersonaConfig[] = [
  {
    id: '1',
    name: 'Tech-savvy Millennials',
    description: 'Technology-oriented young adults with high digital literacy',
    size: 50,
    type: 'custom',
    createdAt: new Date('2023-10-15'),
  },
  {
    id: '2',
    name: 'Budget Shoppers',
    description: 'Price-conscious consumers looking for the best deals',
    size: 30,
    type: 'preset',
    createdAt: new Date('2023-11-20'),
  },
];

/**
 * @description Persona configuration page that allows viewing and creating persona configs
 * @returns The persona configuration page component
 */
export default function PersonaPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className='container py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Persona Configurations</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Add Persona Config
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl max-h-[90vh]'>
            <PersonaConfigForm projectId={projectId} onSuccess={() => setIsModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {mockPersonaConfigs.map((config) => (
          <PersonaConfigCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}

/**
 * @description Card component for displaying a persona configuration
 * @param {Object} props - Component props
 * @param {PersonaConfig} props.config - The persona configuration to display
 * @returns The persona config card component
 */
function PersonaConfigCard({ config }: { config: PersonaConfig }) {
  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle>{config.name}</CardTitle>
            <CardDescription className='mt-1'>
              {config.type === 'preset' ? 'Preset' : 'Custom'} • {config.size} personas
            </CardDescription>
          </div>
          <div className='flex space-x-2'>
            <Button variant='outline' size='icon'>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='outline' size='icon'>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>{config.description}</p>
      </CardContent>
      <CardFooter className='border-t pt-4'>
        <p className='text-xs text-muted-foreground'>
          Created on {config.createdAt.toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  );
}
