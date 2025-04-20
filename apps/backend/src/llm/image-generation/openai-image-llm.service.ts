import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderId } from '@pixeltales/contracts';
import OpenAI from 'openai';
import {
  BaseImageLlmService,
  ImageAnalysisOptions,
  ImageAnalysisResult,
  ImageGenerationOptions,
  ImageGenerationResult,
} from './base-image-llm.service';

/**
 * OpenAI implementation of the image generation service
 * Uses the OpenAI API directly
 */
@Injectable()
export class OpenAIImageLlmService extends BaseImageLlmService {
  private client: OpenAI;
  private readonly model = 'gpt-4o';
  private readonly maxTokens = 4000;

  constructor(private readonly configService: ConfigService) {
    super(OpenAIImageLlmService.name);

    // Initialize OpenAI client
    const apiKey = this.getApiKey('openai');
    this.client = new OpenAI({ apiKey });

    this.logger.log(`Initialized OpenAI client with model ${this.model} for image generation`);
  }

  /**
   * Get API key for the specified provider
   */
  private getApiKey(provider: LlmProviderId): string {
    let apiKey: string | undefined;
    if (provider === 'openai') {
      apiKey = this.configService.get<string>('OPENAI_API_KEY');
    } else if (provider === 'anthropic') {
      apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    }
    if (!apiKey) {
      this.logger.error(`API key for provider '${provider}' not found in environment variables.`);
      throw new Error(`Missing API key for ${provider}`);
    }
    return apiKey;
  }

  /**
   * Generate an image using OpenAI API directly
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    this.logger.log(
      { options },
      `✨🎨 Generating image with prompt: ${options.prompt.substring(0, 50)}...`,
    );

    try {
      // Enhanced prompt for pixel art
      let enhancedPrompt = options.prompt;

      if (options.type === 'image_processing') {
        // Add specific instructions for pixel art style
        enhancedPrompt = `Create a high-quality pixel art image: ${options.prompt}. Make it clean, detailed pixel art with sharp edges and clear contrast. Use a limited color palette typical of pixel art.`;
      }

      this.logger.debug('Image generation prompt:', {
        prompt: enhancedPrompt.substring(0, 100) + '...',
        hasReferenceImages: !!options.images && options.images.length > 0,
      });

      // Prepare messages for the API call
      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [
        {
          role: 'system',
          content:
            'You are an expert AI image generator specialized in pixel art for games. Generate image in response to request.',
        },
      ];

      // Add images to the request if provided
      if (options.images && options.images.length > 0) {
        // Log the images for debugging
        this.logger.debug(
          {
            count: options.images.length,
            roles: options.images.map((img) => img.role),
            firstImageLength: options.images[0]?.image?.length || 0,
            firstImageStart: options.images[0]?.image?.substring(0, 30) || '',
            hasDataUriPrefix: options.images.map((img) => img.image?.startsWith('data:image/')),
          },
          'Input images:',
        );

        // Create multimodal message
        const userContent: Array<OpenAI.Chat.ChatCompletionContentPart> = [
          { type: 'text', text: enhancedPrompt },
        ];

        // Add reference images to the content
        for (const img of options.images) {
          // Check if the image is valid
          if (!img.image || typeof img.image !== 'string') {
            this.logger.warn(`Invalid image for role ${img.role}, skipping`);
            continue;
          }

          // Make sure we strip any existing data URI prefix
          const cleanedImage = this.cleanBase64Image(img.image);

          // Check if cleaned image is valid
          if (!cleanedImage || cleanedImage.length < 100) {
            this.logger.warn(
              {
                originalLength: img.image.length,
                cleanedLength: cleanedImage.length,
              },
              `Image for role ${img.role} seems too short or invalid after cleaning: ${cleanedImage.length} chars`,
            );
            // Don't skip - still try to use what we have
          }

          // Add the image to the content
          this.logger.debug(
            {
              originalImageLength: img.image.length,
              cleanedImageLength: cleanedImage.length,
              cleanedImageStart: cleanedImage.substring(0, 30),
              role: img.role,
            },
            `Adding image with role ${img.role} to message`,
          );

          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${cleanedImage}`,
              detail: 'high',
            },
          });
        }

        // Add the message with images to the messages array
        messages.push({
          role: 'user',
          content: userContent,
        });
      } else {
        this.logger.debug(`User message without images`);
        // Simple text message without images
        messages.push({
          role: 'user',
          content: enhancedPrompt,
        });
      }

      // Call the OpenAI API directly
      this.logger.debug({ messages }, `Calling OpenAI API...`);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        temperature: 0.7,
      });

      // Extract the response content
      const content = response.choices[0]?.message?.content || '';

      this.logger.debug(
        {
          response,
          contentLength: content.length,
          contentStart: content.substring(0, 50),
          contentEnd: content.substring(content.length - 50),
          hasMarkdown: content.includes('```'),
          hasBase64Prefix: content.includes('data:image/'),
        },
        `✨🎨 Raw OpenAI API response received`,
      );

      // Parse the response to extract the base64 image
      const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      const cleanedContent = content.replace(/```[^`]*```/g, '').trim();

      // Find the base64 content
      let base64Image = '';

      // Try to extract base64 directly using regex pattern
      if (base64Pattern.test(cleanedContent)) {
        this.logger.debug('Base64 pattern matched the entire cleaned content');
        base64Image = cleanedContent;
      } else {
        // Try to extract from content with data:image format
        const dataUriMatches = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (dataUriMatches && dataUriMatches[1]) {
          this.logger.debug('Extracted base64 from data URI format');
          base64Image = dataUriMatches[1];
        } else {
          // Try to extract just base64 part - looking for common PNG/JPG headers in base64
          const pngMatches = content.match(/iVBOR[A-Za-z0-9+/=]{40,}/);
          if (pngMatches) {
            this.logger.debug('Found PNG header in content');
            base64Image = pngMatches[0];
          } else {
            const jpgMatches = content.match(/\/9j\/[A-Za-z0-9+/=]{40,}/);
            if (jpgMatches) {
              this.logger.debug('Found JPG header in content');
              base64Image = jpgMatches[0];
            } else {
              // Last resort - try to find any long base64-like string
              const base64Matches = content.match(/([A-Za-z0-9+/=]{40,})/);
              if (base64Matches && base64Matches[1]) {
                this.logger.debug('Extracted potential base64 string from response');
                base64Image = base64Matches[1];
              } else {
                this.logger.error('Could not extract base64 image from response. Raw content:', {
                  contentLength: content.length,
                  contentPreview: content.substring(0, 200),
                });
                throw new Error('Failed to extract valid image data from LLM response');
              }
            }
          }
        }
      }

      if (!base64Image) {
        throw new Error('No valid image data found in LLM response');
      }

      // Validate and fix the base64 string
      base64Image = this.validateAndFixBase64(base64Image);

      // Ensure the image has the proper data URI prefix
      // Only add the prefix if it's not already there
      if (!base64Image.startsWith('data:image/')) {
        base64Image = `data:image/png;base64,${base64Image}`;
      }

      this.logger.debug('Final image URL created', {
        urlLength: base64Image.length,
        urlStart: base64Image.substring(0, 50),
      });

      return { image: base64Image };
    } catch (error) {
      this.logger.error(
        `Image generation failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          errorStack: error instanceof Error ? error.stack : undefined,
          errorName: error instanceof Error ? error.name : undefined,
        },
      );
      throw new Error(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Analyze an image using OpenAI's vision capabilities
   */
  async analyzeImage(options: ImageAnalysisOptions): Promise<ImageAnalysisResult> {
    this.logger.log(`🔍 Analyzing image with prompt: ${options.prompt.substring(0, 50)}...`);

    try {
      // Validate input image
      if (!options.image) {
        throw new Error('No image provided for analysis');
      }

      // Log input image stats
      this.logger.debug('Input image stats:', {
        imageLength: options.image.length,
        hasDataUriPrefix: options.image.startsWith('data:image/'),
        firstChars: options.image.substring(0, 30),
      });

      // Clean the base64 image if needed - this removes the data URI prefix if present
      const base64Image = this.cleanBase64Image(options.image);

      if (!base64Image || base64Image.length < 100) {
        this.logger.error('Input image seems invalid after cleaning', {
          originalLength: options.image.length,
          cleanedLength: base64Image.length,
        });
        throw new Error('Invalid image data provided for analysis');
      }

      // Prepare user message content
      let userContent = options.prompt;

      // Add template data to the prompt if available
      if (options.templateData) {
        userContent += `\n\nHere is the template data for reference: ${JSON.stringify(options.templateData)}`;
      }

      // Request JSON output format
      userContent +=
        '\n\nRespond with valid JSON only. If extracting coordinates, include an array of objects with id, x, y, width, and height properties.';

      // Create the message content with the image
      const content: Array<OpenAI.Chat.ChatCompletionContentPart> = [
        { type: 'text', text: userContent },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${base64Image}`,
            detail: 'high',
          },
        },
      ];

      // Prepare the messages for the API call
      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [
        {
          role: 'system',
          content:
            'You are an expert image analyzer specialized in pixel art and game sprites. Analyze the provided image and respond with structured JSON data.',
        },
        {
          role: 'user',
          content,
        },
      ];

      this.logger.debug('Calling OpenAI API with image analysis prompt...');

      // Call the OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: this.maxTokens,
        temperature: 0.2, // Low temperature for more deterministic results
      });

      // Extract the response content
      const responseContent = response.choices[0]?.message?.content || '{}';

      this.logger.debug('Raw image analysis response received', {
        responseLength: responseContent.length,
        responseStart: responseContent.substring(0, 50),
        responseEnd: responseContent.substring(responseContent.length - 50),
      });

      // Parse the JSON result
      let result: Record<string, unknown>;
      try {
        // Parse the JSON response
        result = JSON.parse(responseContent);
      } catch (parseError) {
        this.logger.error('Failed to parse analysis result as JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          content:
            responseContent.length > 200
              ? responseContent.substring(0, 200) + '...'
              : responseContent,
        });
        throw new Error('Failed to parse image analysis result');
      }

      // Process coordinates if present for consistency
      if (
        options.prompt.toLowerCase().includes('coordinate') &&
        Array.isArray(result.coordinates)
      ) {
        this.logger.debug('Processing coordinates from result', {
          coordinatesCount: result.coordinates.length,
        });
        result.coordinates = this.processCoordinates(result.coordinates as unknown[]);
      }

      return result as ImageAnalysisResult;
    } catch (error) {
      this.logger.error(
        `Image analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          errorStack: error instanceof Error ? error.stack : undefined,
          errorName: error instanceof Error ? error.name : undefined,
          prompt: options.prompt.substring(0, 100),
        },
      );
      throw new Error(
        `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
