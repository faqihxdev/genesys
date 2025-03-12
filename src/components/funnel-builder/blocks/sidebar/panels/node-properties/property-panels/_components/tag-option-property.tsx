import { TagsNodeData } from '@/components/funnel-builder/blocks/nodes/tags-node/tags.node';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react/dist/iconify.js';

export const TagOptionProperty = ({
  option,
  handleRemoveOption,
  handleEditOption,
}: {
  option: TagsNodeData['options'][number];
  handleUpdateOption: (index: number, option: TagsNodeData['options'][number]) => void;
  handleRemoveOption: (optionId: string) => void;
  handleEditOption: (optionId: string) => void;
}) => {
  // Ensure we display a valid number for the option ID
  const displayId =
    typeof option.option.id === 'number' && !isNaN(option.option.id) ? option.option.id + 1 : '•';

  return (
    <div className='mt-2 flex' key={option.id}>
      <Badge
        variant={'outline'}
        className='group self-center mr-2 h-8 w-[34px] flex justify-center items-center border rounded-full text-center'
      >
        <p className='group-hover:hidden text-sm'>{displayId}</p>
        <Icon
          icon={'iconamoon:trash-fill'}
          className='hidden group-hover:block cursor-pointer text-red-400'
          onClick={() => handleRemoveOption(option.id)}
        />
      </Badge>
      <div className='flex-1 flex items-center border rounded-md px-3 py-2 text-sm'>
        <span className='font-medium mr-2'>{option.option.name}</span>
        <span className='text-card-foreground/60 text-xs'>({option.option.type})</span>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='ml-2'
        onClick={() => handleEditOption(option.id)}
      >
        <Icon icon='lucide:edit' className='size-4' />
      </Button>
    </div>
  );
};
