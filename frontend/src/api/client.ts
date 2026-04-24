import createClient from 'openapi-fetch';
import type { components, paths } from './types.gen';

export const apiClient = createClient<paths>({ baseUrl: '' });

export type Schemas = components['schemas'];
