import { z, ZodFirstPartyTypeKind, ZodTypeAny } from 'zod';

// Define minimal interfaces for the internal Zod structure
interface ZodDef {
  typeName: ZodFirstPartyTypeKind;
  checks?: any[];
  pattern?: unknown;
  minLength?: unknown;
  maxLength?: unknown;
  format?: unknown;
  unknownKeys?: 'strict' | 'strip' | 'passthrough';
  type?: ZodTypeAny;
  valueType?: ZodTypeAny;
  innerType?: ZodTypeAny;
  schema?: ZodTypeAny;
  options?: ZodTypeAny[];
  items?: ZodTypeAny[];
  getter?: () => ZodTypeAny;
  shape?: () => Record<string, ZodTypeAny>;
}

// Define a type for Zod schema with _def property
interface ZodTypeWithDef extends ZodTypeAny {
  _def: ZodDef;
}

// Safe access to internal _def (we know what we're doing)
function getDef(schema: ZodTypeAny): ZodDef {
  return (schema as ZodTypeWithDef)._def;
}

/**
 * Recursively removes only unsupported validation constraints from a Zod schema.
 * This preserves the original types, including descriptions and unions.
 * It mutates `_def` objects where necessary to remove unsupported OpenAI JSON Schema features.
 */
export function stripUnsupportedZod<T extends ZodTypeAny>(schema: T): T {
  const def = getDef(schema);

  switch (def.typeName) {
    case ZodFirstPartyTypeKind.ZodObject: {
      if (typeof def.shape === 'function') {
        const shape = def.shape();
        for (const key in shape) {
          if (shape[key]) {
            shape[key] = stripUnsupportedZod(shape[key]);
          }
        }
      }
      def.unknownKeys = 'strict'; // apply additionalProperties: false
      return schema;
    }

    case ZodFirstPartyTypeKind.ZodString:
      if (def.checks) def.checks = [];
      if ('pattern' in def) delete def.pattern;
      if ('minLength' in def) delete def.minLength;
      if ('maxLength' in def) delete def.maxLength;
      if ('format' in def) delete def.format;
      return schema;

    case ZodFirstPartyTypeKind.ZodNumber:
      if (def.checks) def.checks = [];
      return schema;

    case ZodFirstPartyTypeKind.ZodArray:
      if (def.type) {
        def.type = stripUnsupportedZod(def.type);
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodRecord:
      if (def.valueType) {
        def.valueType = stripUnsupportedZod(def.valueType);
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodUnion:
      if (def.options && Array.isArray(def.options)) {
        def.options = def.options.map(stripUnsupportedZod);
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodNullable:
      if (def.innerType) {
        def.innerType = stripUnsupportedZod(def.innerType);
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodOptional: {
      if (def.innerType) {
        const inner = stripUnsupportedZod(def.innerType);
        // Create a union of the inner type and null
        return z.union([inner, z.null()]) as unknown as T;
      }
      return schema;
    }

    case ZodFirstPartyTypeKind.ZodDefault:
    case ZodFirstPartyTypeKind.ZodEffects:
      if (def.innerType) {
        return stripUnsupportedZod(def.innerType) as T;
      }
      if (def.schema) {
        return stripUnsupportedZod(def.schema) as T;
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodTuple:
      if (def.items && Array.isArray(def.items)) {
        def.items = def.items.map(stripUnsupportedZod);
      }
      return schema;

    case ZodFirstPartyTypeKind.ZodLazy:
      if (def.getter && typeof def.getter === 'function') {
        // Make sure getter cannot be undefined before calling it
        const getter = def.getter;
        return z.lazy(() => stripUnsupportedZod(getter())) as unknown as T;
      }
      return schema;

    default:
      return schema;
  }
}
