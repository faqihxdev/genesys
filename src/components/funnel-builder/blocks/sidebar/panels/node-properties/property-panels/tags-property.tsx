import { BuilderNodeType } from '@/components/funnel-builder/blocks/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Icon } from '@iconify/react/dist/iconify.js';
import { useReactFlow } from '@xyflow/react';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { isEmpty } from 'radash';
import { useCallback, useState } from 'react';
import { TagsNodeData } from '../../../../nodes/tags-node/tags.node';
import { TagOptionProperty } from './_components/tag-option-property';

type TagsNodePropertyPanelProps = Readonly<{
  id: string;
  type: BuilderNodeType;
  data: TagsNodeData;
  updateData: (data: Partial<TagsNodeData>) => void;
}>;

export default function TagsNodePropertyPanel({
  id,
  data,
  updateData,
}: TagsNodePropertyPanelProps) {
  const { setNodes } = useReactFlow();
  const [showDialog, setShowDialog] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  // Option form state
  const [optionName, setOptionName] = useState('');
  const [optionDescription, setOptionDescription] = useState('');
  const [optionType, setOptionType] = useState<'text' | 'image'>('text');
  const [optionContent, setOptionContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetFormState = () => {
    setOptionName('');
    setOptionDescription('');
    setOptionType('text');
    setOptionContent('');
    setImagePreview(null);
    setEditingOptionId(null);
  };

  const handleRemoveOption = useCallback(
    (optionId: string) => {
      setNodes((nodes) =>
        produce(nodes, (draft) => {
          const node = draft.find((n) => n.id === id);

          if (node) {
            const options = node.data.options as TagsNodeData['options'];
            const optionIndex = options.findIndex((p) => p.id === optionId);

            if (optionIndex !== -1) {
              options.splice(optionIndex, 1);

              options
                .sort((a, b) => a.option.id - b.option.id)
                .forEach((option, index) => {
                  option.option.id = index;
                });
            }
          }
        })
      );
    },
    [id, setNodes]
  );

  const handleUpdateOption = useCallback(
    (index: number, option: TagsNodeData['options'][number]) => {
      updateData({
        options: data.options.map((o, i) => (i === index ? option : o)),
      });
    },
    [data.options, updateData]
  );

  const handleAddOption = useCallback(() => {
    if (
      isEmpty(optionName) ||
      isEmpty(optionDescription) ||
      (optionType === 'text' && isEmpty(optionContent)) ||
      (optionType === 'image' && !imagePreview)
    ) {
      return; // Don't add if required fields are empty
    }

    // Create a new option
    const newOption = {
      id: nanoid(),
      option: {
        id: data.options.length, // Use the length as the index for proper sequential numbering
        name: optionName,
        description: optionDescription,
        type: optionType,
        content: optionType === 'text' ? optionContent : imagePreview || '',
      },
    };

    // Use updateData to update the node data instead of directly modifying the nodes
    updateData({
      options: [...data.options, newOption],
    });

    // Reset form and close dialog
    resetFormState();
    setShowDialog(false);
  }, [
    data.options,
    optionName,
    optionDescription,
    optionType,
    optionContent,
    imagePreview,
    updateData,
  ]);

  const handleEditOption = useCallback(
    (optionId: string) => {
      const option = data.options.find((o) => o.id === optionId);
      if (option) {
        setOptionName(option.option.name);
        setOptionDescription(option.option.description || '');
        setOptionType(option.option.type);
        setOptionContent(option.option.content);
        setImagePreview(option.option.type === 'image' ? option.option.content : null);
        setEditingOptionId(optionId);
      }
      setShowDialog(true);
    },
    [data.options]
  );

  const handleSaveEditedOption = useCallback(() => {
    if (editingOptionId) {
      const optionIndex = data.options.findIndex((o) => o.id === editingOptionId);
      if (optionIndex !== -1) {
        const newOption = {
          id: editingOptionId,
          option: {
            id: optionIndex,
            name: optionName,
            description: optionDescription,
            type: optionType,
            content: optionType === 'text' ? optionContent : imagePreview || '',
          },
        };
        updateData({
          options: data.options.map((o, i) => (i === optionIndex ? newOption : o)),
        });
      }
    }
    resetFormState();
    setShowDialog(false);
  }, [
    editingOptionId,
    data.options,
    optionName,
    optionDescription,
    optionType,
    optionContent,
    imagePreview,
    updateData,
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isAddButtonDisabled =
    isEmpty(optionName) ||
    isEmpty(optionDescription) ||
    (optionType === 'text' && isEmpty(optionContent)) ||
    (optionType === 'image' && !imagePreview);

  return (
    <div className='flex flex-col gap-4.5 p-4'>
      <div className='text-xs text-card-foreground/20 self-end '>{id}</div>

      <div className='flex flex-col'>
        <div className='text-xs text-card-foreground/60 font-semibold'>Stage Name</div>

        <div className='mt-2 flex'>
          <Input
            type='text'
            value={data.name || ''}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder='Enter stage name...'
            required
          />
        </div>
      </div>

      <div className='flex flex-col'>
        <div className='text-xs text-card-foreground/60 font-semibold'>Description</div>

        <div className='mt-2 my-3 flex'>
          <Textarea
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            placeholder='Enter stage description...'
            className='min-h-24 w-full resize-none'
          />
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='text-xs text-card-foreground/60 font-semibold'>Items</div>

        {Array.from(data.options)
          .sort((a, b) => a.option.id - b.option.id)
          .map((option) => (
            <div key={option.id}>
              <TagOptionProperty
                option={option}
                handleUpdateOption={handleUpdateOption}
                handleRemoveOption={handleRemoveOption}
                handleEditOption={handleEditOption}
              />
            </div>
          ))}

        <Button
          className='mt-2'
          size={'sm'}
          variant={'outline'}
          onClick={() => setShowDialog(true)}
        >
          Add Item
        </Button>

        {/* Add Option Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{editingOptionId ? 'Edit Option' : 'Add Stage Item'}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-2 px-1'>
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  Stage Item Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  value={optionName}
                  onChange={(e) => setOptionName(e.target.value)}
                  placeholder='Enter stage item name'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>
                  Stage Item Description <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='description'
                  value={optionDescription}
                  onChange={(e) => setOptionDescription(e.target.value)}
                  placeholder='Enter stage item description'
                  className='min-h-24 resize-none'
                />
              </div>

              <div className='space-y-2'>
                <Label>
                  Content Type <span className='text-red-500'>*</span>
                </Label>
                <RadioGroup
                  value={optionType}
                  onValueChange={(value) => setOptionType(value as 'text' | 'image')}
                  className='flex space-x-4'
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='text' id='text' />
                    <Label htmlFor='text'>Text</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='image' id='image' />
                    <Label htmlFor='image'>Image</Label>
                  </div>
                </RadioGroup>
              </div>

              {optionType === 'text' ? (
                <div className='space-y-2'>
                  <Label htmlFor='content'>
                    Text Content <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    id='content'
                    value={optionContent}
                    onChange={(e) => setOptionContent(e.target.value)}
                    placeholder='Enter text content'
                    className='min-h-24 resize-none'
                  />
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label>Image</Label>
                  <div
                    className='border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px] relative'
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <>
                        <Image
                          src={imagePreview}
                          alt='Preview'
                          className='max-h-[200px] object-contain rounded-md'
                        />
                        <Button
                          variant='ghost'
                          size='icon'
                          className='absolute top-2 right-2 bg-card/80 hover:bg-card/90 rounded-full h-8 w-8 p-1'
                          onClick={() => setImagePreview(null)}
                        >
                          <Icon icon='lucide:x' className='h-4 w-4' />
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className='text-card-foreground/60 text-center'>Drop or Upload Image</p>
                        <div className='mt-4'>
                          <Label
                            htmlFor='image-upload'
                            className='cursor-pointer px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90'
                          >
                            Upload
                          </Label>
                          <Input
                            id='image-upload'
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={handleImageUpload}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  resetFormState();
                  setShowDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingOptionId ? handleSaveEditedOption : handleAddOption}
                disabled={isAddButtonDisabled}
              >
                {editingOptionId ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
