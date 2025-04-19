/**
 * Text content type for multimodal messages
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Image content type for multimodal messages
 */
export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high';
  };
}

/**
 * Combined message content types
 */
export type MessageContent = TextContent | ImageContent | string;
