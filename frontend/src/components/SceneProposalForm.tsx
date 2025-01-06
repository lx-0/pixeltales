import { TILE_SIZE } from '@/game/config';
import type { CharacterConfig, LLMConfig, SceneConfig } from '@/types/scene';
import { kebabCase } from '@/utils/format';
import { Logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getModelOptions, useConfig } from '../hooks/use-config';
import { useSceneProposal } from '../hooks/use-scenes';
import { ColorPalette } from './ColorPalette';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';

// Form validation schema
const proposalFormSchema = z.object({
  sceneName: z
    .string()
    .min(3, 'Scene name must be at least 3 characters')
    .max(50, 'Scene name must not exceed 50 characters'),
  sceneDescription: z
    .string()
    .min(10, 'Scene description must be at least 10 characters')
    .max(500, 'Scene description must not exceed 500 characters'),
  proposerName: z
    .string()
    .min(2, 'Proposer name must be at least 2 characters')
    .max(50, 'Proposer name must not exceed 50 characters'),
  characters: z
    .array(
      z.object({
        name: z.string().min(1, 'Character name is required'),
        role: z
          .string()
          .min(10, 'Role description must be at least 10 characters')
          .max(500, 'Role description must not exceed 500 characters'),
        visual: z
          .string()
          .min(10, 'Visual description must be at least 10 characters')
          .max(500, 'Visual description must not exceed 500 characters'),
        color: z.string().min(1, 'Color is required'),
        llm_config: z.object({
          provider: z.string().min(1, 'Provider is required'),
          model_name: z.string().min(1, 'Model is required'),
          temperature: z.number().min(0).max(2).default(0.7),
          max_tokens: z.number().min(1).max(4000).default(1000),
        }),
      }),
    )
    .min(2, 'At least two characters are required'),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface SceneProposalFormProps {
  trigger?: React.ReactNode;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function SceneProposalForm({
  trigger,
  setIsModalOpen,
}: SceneProposalFormProps) {
  const { data: config, isLoading, error } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const proposeMutation = useSceneProposal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      sceneName: '',
      sceneDescription: '',
      proposerName: '',
      characters: [
        {
          name: '',
          role: '',
          visual: '',
          color: 'blue',
          llm_config: {
            provider: 'openai',
            model_name: 'gpt-4o-mini-2024-07-18',
            temperature: 0.7,
            max_tokens: 4000,
          },
        },
        {
          name: '',
          role: '',
          visual: '',
          color: 'pink',
          llm_config: {
            provider: 'openai',
            model_name: 'gpt-4o-mini-2024-07-18',
            temperature: 0.7,
            max_tokens: 4000,
          },
        },
      ],
    },
  });

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  if (error) {
    return <div>Error loading configuration. Please try again later.</div>;
  }

  const handleSubmit = async (values: ProposalFormValues) => {
    Logger.info('SceneProposalForm', 'Submitting proposal', values);
    try {
      setIsSubmitting(true);

      // Convert form values to scene config
      const sceneConfig: Omit<SceneConfig, 'id' | 'status' | 'system_prompt'> =
        {
          name: values.sceneName,
          description: values.sceneDescription,
          proposer_name: values.proposerName,
          start_character_id: kebabCase(values.characters[0].name),
          characters_config: values.characters.reduce((acc, char, index) => {
            // Find the color option to get the hex code
            const colorOption = config?.colors.find((c) => c.id === char.color);
            if (!colorOption) {
              throw new Error(`Color ${char.color} not found in config`);
            }

            acc[kebabCase(char.name)] = {
              id: kebabCase(char.name),
              ...char,
              color: colorOption.hex, // Use hex code instead of color ID
              llm_config: {
                ...char.llm_config,
                provider: char.llm_config.provider as LLMConfig['provider'],
              },
              // Add required initial state fields
              initial_position: {
                x: TILE_SIZE * (7.5 + index), // Start at x=7.5 tiles, increment by 1 tile
                y: TILE_SIZE * 7.5, // Center vertically
              },
              initial_direction: 'right' as const,
              initial_action: 'idle' as const,
              initial_mood: 'neutral',
            };
            return acc;
          }, {} as Record<string, CharacterConfig>),
        };

      await proposeMutation.mutateAsync(sceneConfig);

      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to submit proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Propose New Scene</Button>}
      </DialogTrigger>
      <DialogContent
        className={
          'sm:max-w-[600px] lg:max-w-screen-lg overflow-y-scroll max-h-screen bg-gray-900'
        }
      >
        <DialogHeader>
          <DialogTitle>Propose New Scene</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a proposal for the next conversation scene. Describe the
            characters and their context.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sceneName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Scene Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give your scene a name..."
                        className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      A short, descriptive name for your scene proposal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proposerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name..."
                        className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Your name will be shown with the proposal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sceneDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">
                    Scene Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what makes this scene interesting..."
                      className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    A brief description to help others understand and vote on
                    your proposal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-200">Characters</h4>
              {form.watch('characters').map((_, index) => (
                <div
                  key={index}
                  className="space-y-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`characters.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Character name"
                              className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`characters.${index}.color`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Color</FormLabel>
                          <FormControl>
                            <ColorPalette
                              colors={config?.colors ?? []}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`characters.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Role Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the character's role and personality..."
                            className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`characters.${index}.visual`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Visual Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the character's appearance..."
                            className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <Accordion type="single" collapsible>
                      <AccordionItem
                        value="llm-config"
                        className="border-gray-700"
                      >
                        <AccordionTrigger className="text-gray-200 hover:text-gray-100">
                          LLM Configuration
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`characters.${index}.llm_config`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-200">
                                      Model
                                    </FormLabel>
                                    <Select
                                      onValueChange={(value: string) => {
                                        const [provider, model] =
                                          value.split(':');
                                        const modelOption =
                                          config?.llm_providers
                                            .find((p) => p.id === provider)
                                            ?.models.find(
                                              (m) => m.id === model,
                                            );

                                        if (modelOption) {
                                          field.onChange({
                                            ...field.value,
                                            provider,
                                            model_name: model,
                                            max_tokens: modelOption.max_tokens,
                                            temperature:
                                              modelOption.default_temperature,
                                          });
                                        }
                                      }}
                                      value={`${field.value.provider}:${field.value.model_name}`}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="text-left px-4 h-auto py-2 bg-gray-800 border-gray-700 text-gray-200">
                                          <SelectValue placeholder="Select model">
                                            {field.value && (
                                              <div className="flex flex-col gap-1 py-1">
                                                <span className="font-medium">
                                                  {
                                                    config?.llm_providers
                                                      .find(
                                                        (p) =>
                                                          p.id ===
                                                          field.value.provider,
                                                      )
                                                      ?.models.find(
                                                        (m) =>
                                                          m.id ===
                                                          field.value
                                                            .model_name,
                                                      )?.name
                                                  }
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                  {
                                                    config?.llm_providers
                                                      .find(
                                                        (p) =>
                                                          p.id ===
                                                          field.value.provider,
                                                      )
                                                      ?.models.find(
                                                        (m) =>
                                                          m.id ===
                                                          field.value
                                                            .model_name,
                                                      )?.description
                                                  }
                                                </span>
                                              </div>
                                            )}
                                          </SelectValue>
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent
                                        align="start"
                                        className="w-[--radix-select-trigger-width] p-4 bg-gray-800 border-gray-700"
                                      >
                                        {config &&
                                          getModelOptions(
                                            config.llm_providers,
                                          ).map((group) => (
                                            <SelectGroup
                                              key={group.label}
                                              className="space-y-1"
                                            >
                                              <SelectLabel className="px-1 text-gray-400">
                                                {group.label}
                                              </SelectLabel>
                                              {group.options.map((option) => (
                                                <SelectItem
                                                  key={option.value}
                                                  value={option.value}
                                                  className="whitespace-normal text-gray-200"
                                                >
                                                  <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                      {option.label}
                                                    </span>
                                                    {option.label_details && (
                                                      <span className="text-xs text-gray-400">
                                                        {option.label_details}
                                                      </span>
                                                    )}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectGroup>
                                          ))}
                                      </SelectContent>
                                      <FormDescription className="text-gray-400">
                                        Select the AI model for this character.
                                      </FormDescription>
                                      <FormMessage />
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`characters.${index}.llm_config.temperature`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-200">
                                      Temperature
                                    </FormLabel>
                                    <FormControl className="pt-3 pb-1">
                                      <Slider
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        value={[field.value]}
                                        onValueChange={([value]) =>
                                          field.onChange(value)
                                        }
                                        className="[&_[role=slider]]:bg-gray-200"
                                      />
                                    </FormControl>
                                    <FormDescription className="text-gray-400">
                                      {field.value.toFixed(1)} - Higher values
                                      make the output more random
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
