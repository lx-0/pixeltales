import { zodResolver } from '@hookform/resolvers/zod';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { Schemas } from '@/api/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { TILE_SIZE } from '@/game/config';
import { useCharacters, useCreateCharacter } from '@/hooks/use-characters';
import { getModelOptions, useConfig } from '@/hooks/use-config';
import { useSceneProposal } from '@/hooks/use-scenes';
import type { LLMConfig } from '@/types/scene';

type CharacterPlacement = Schemas['CharacterPlacement'];
type CreateSceneConfig = Schemas['CreateSceneConfig'];

import { kebabCase } from '@/utils/format';
import { Logger } from '@/utils/logger';
import { ColorPalette } from './ColorPalette';

// Form validation schema. Per-character row supports two modes:
//  - library_id set → reference an existing library character (other fields ignored)
//  - library_id empty → "create new", inline fields are required and get
//    POSTed to /api/v1/characters before the scene proposal lands.
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
  room_id: z.string().min(1, 'Room is required'),
  characters: z
    .array(
      z
        .object({
          library_id: z.string(), // empty = "create new"
          name: z.string(),
          role: z.string(),
          visual: z.string(),
          color: z.string(),
          sprite_id: z.string(),
          llm_config: z.object({
            provider: z.string(),
            model_name: z.string(),
            temperature: z.number().min(0).max(2).default(0.7),
            max_tokens: z.number().min(1).max(4000).default(1000),
          }),
        })
        .superRefine((char, ctx) => {
          if (char.library_id) return; // library mode — inline fields ignored
          // create-new mode — enforce the same rules the old schema used
          const need = (path: string, msg: string, ok: boolean) => {
            if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: msg });
          };
          need('name', 'Character name is required', char.name.length >= 1);
          need(
            'role',
            'Role description must be at least 10 characters',
            char.role.length >= 10 && char.role.length <= 500
          );
          need(
            'visual',
            'Visual description must be at least 10 characters',
            char.visual.length >= 10 && char.visual.length <= 500
          );
          need('color', 'Color is required', char.color.length >= 1);
          need('sprite_id', 'Sprite is required', char.sprite_id.length >= 1);
          need('llm_config.provider', 'Provider is required', char.llm_config.provider.length >= 1);
          need(
            'llm_config.model_name',
            'Model is required',
            char.llm_config.model_name.length >= 1
          );
        })
    )
    .min(2, 'At least two characters are required'),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface SceneProposalFormProps {
  trigger?: React.ReactNode;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function SceneProposalForm({ trigger, setIsModalOpen }: SceneProposalFormProps) {
  const { data: config, isLoading, error } = useConfig();
  const { data: library = [] } = useCharacters();
  const createCharacter = useCreateCharacter();
  const [isOpen, setIsOpen] = useState(false);
  const proposeMutation = useSceneProposal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      sceneName: '',
      sceneDescription: '',
      proposerName: '',
      room_id: 'room',
      characters: [
        {
          library_id: 'bob',
          name: '',
          role: '',
          visual: '',
          color: 'blue',
          sprite_id: 'bob',
          llm_config: {
            provider: 'openai',
            model_name: 'gpt-4o-mini-2024-07-18',
            temperature: 0.7,
            max_tokens: 4000,
          },
        },
        {
          library_id: 'alice',
          name: '',
          role: '',
          visual: '',
          color: 'pink',
          sprite_id: 'cleaner_girl',
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
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // Step 1: resolve each row to a library character id. "create new"
      // rows POST to /api/v1/characters first; "library" rows reuse the id.
      const resolvedIds: string[] = [];
      for (const char of values.characters) {
        if (char.library_id) {
          resolvedIds.push(char.library_id);
          continue;
        }

        const colorOption = config?.colors.find((c) => c.id === char.color);
        if (!colorOption) {
          throw new Error(`Color ${char.color} not found in config`);
        }
        const newId = kebabCase(char.name);
        await createCharacter.mutateAsync({
          id: newId,
          name: char.name,
          color: colorOption.hex,
          sprite_id: char.sprite_id,
          visual: char.visual,
          role: char.role,
          llm_config: {
            ...char.llm_config,
            provider: char.llm_config.provider as LLMConfig['provider'],
          },
        });
        resolvedIds.push(newId);
      }

      // Step 2: build the scene proposal with placement-only entries.
      const sceneConfig: CreateSceneConfig = {
        name: values.sceneName,
        description: values.sceneDescription,
        status: 'proposed',
        votes: null,
        proposer_name: values.proposerName,
        start_character_id: resolvedIds[0],
        room_id: values.room_id,
        characters_config: resolvedIds.reduce(
          (acc, id, index) => {
            acc[id] = {
              id,
              initial_position: {
                x: TILE_SIZE * (7.5 + index),
                y: TILE_SIZE * 7.5,
              },
              initial_direction: 'right',
              initial_action: 'idle',
              initial_mood: 'neutral',
            };
            return acc;
          },
          {} as Record<string, CharacterPlacement>
        ),
      };

      await proposeMutation.mutateAsync(sceneConfig);

      setIsOpen(false);
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit proposal';
      Logger.error('SceneProposalForm', 'submit failed', err);
      setSubmitError(message);
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
        className={'sm:max-w-[600px] lg:max-w-screen-lg overflow-y-scroll max-h-screen bg-gray-900'}
      >
        <DialogHeader>
          <DialogTitle>Propose New Scene</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a proposal for the next conversation scene. Describe the characters and their
            context.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  <FormLabel className="text-gray-200">Scene Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what makes this scene interesting..."
                      className="bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    A brief description to help others understand and vote on your proposal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Room</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {(config?.rooms ?? []).map((room) => (
                        <SelectItem key={room.id} value={room.id} className="text-gray-200">
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-400">
                    Background scene where the conversation plays out.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-200">Characters</h4>
              <p className="text-xs text-gray-400">
                Pick from the library or set "Create new…" to define a fresh character. New
                characters are saved to the library on submit and become reusable.
              </p>
              {form.watch('characters').map((_, index) => {
                const libraryId = form.watch(`characters.${index}.library_id`);
                const isCreatingNew = !libraryId;
                return (
                  <div
                    key={index}
                    className="space-y-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50"
                  >
                    <FormField
                      control={form.control}
                      name={`characters.${index}.library_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Library character</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === '__new__' ? '' : v)}
                            value={field.value || '__new__'}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                                <SelectValue placeholder="Select character" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="__new__" className="text-gray-200">
                                Create new…
                              </SelectItem>
                              {library.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="text-gray-200">
                                  {c.name}
                                  <span className="ml-2 text-xs text-gray-400">({c.id})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isCreatingNew && (
                      <p className="text-xs text-gray-400">
                        Using existing library character — identity comes from the library;
                        placement is set by the scene.
                      </p>
                    )}
                    {isCreatingNew && (
                      <>
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
                          name={`characters.${index}.sprite_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Sprite</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                                    <SelectValue placeholder="Select sprite" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  {(config?.sprites ?? []).map((sprite) => (
                                    <SelectItem
                                      key={sprite.id}
                                      value={sprite.id}
                                      className="text-gray-200"
                                    >
                                      {sprite.name}
                                      {!sprite.has_idle_anim && (
                                        <span className="ml-2 text-xs text-gray-400">(static)</span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`characters.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-200">Role Description</FormLabel>
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
                              <FormLabel className="text-gray-200">Visual Description</FormLabel>
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
                            <AccordionItem value="llm-config" className="border-gray-700">
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
                                          <FormLabel className="text-gray-200">Model</FormLabel>
                                          <Select
                                            onValueChange={(value: string) => {
                                              const [provider, model] = value.split(':');
                                              const modelOption = config?.llm_providers
                                                .find((p) => p.id === provider)
                                                ?.models.find((m) => m.id === model);

                                              if (modelOption) {
                                                field.onChange({
                                                  ...field.value,
                                                  provider,
                                                  model_name: model,
                                                  max_tokens: modelOption.max_tokens,
                                                  temperature: modelOption.default_temperature,
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
                                                              (p) => p.id === field.value.provider
                                                            )
                                                            ?.models.find(
                                                              (m) => m.id === field.value.model_name
                                                            )?.name
                                                        }
                                                      </span>
                                                      <span className="text-xs text-gray-400">
                                                        {
                                                          config?.llm_providers
                                                            .find(
                                                              (p) => p.id === field.value.provider
                                                            )
                                                            ?.models.find(
                                                              (m) => m.id === field.value.model_name
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
                                                getModelOptions(config.llm_providers).map(
                                                  (group) => (
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
                                                  )
                                                )}
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
                                              onValueChange={([value]) => field.onChange(value)}
                                              className="[&_[role=slider]]:bg-gray-200"
                                            />
                                          </FormControl>
                                          <FormDescription className="text-gray-400">
                                            {field.value.toFixed(1)} - Higher values make the output
                                            more random
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {submitError && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded p-2">
                {submitError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                  setSubmitError(null);
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
