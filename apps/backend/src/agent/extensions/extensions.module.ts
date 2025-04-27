import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { AuditoryPerceptionExtension } from './auditory-perception.extension';
import { CAPABILITY_EXTENSION, ICapabilityExtension } from './capability.extension.interface';
import { MotionControlExtension } from './motion-control.extension';
import { SpeechOutputExtension } from './speech-output.extension';
import { VisualPerceptionExtension } from './visual-perception.extension';

// List ACTION extension classes here
const capabilityProviders = [
  SpeechOutputExtension,
  MotionControlExtension,
  // Add other ACTION extensions here
];

// List PERCEPTION extension classes here
const perceptionProviders = [
  VisualPerceptionExtension,
  AuditoryPerceptionExtension,
  // Add other PERCEPTION extensions here
];

@Module({
  imports: [CoreModule],
  providers: [
    // Provide all extensions so NestJS manages their lifecycle
    ...capabilityProviders,
    ...perceptionProviders,

    // Provide the array of ACTION extensions under the CAPABILITY_EXTENSION token
    {
      provide: CAPABILITY_EXTENSION,
      useFactory: (...extensions: ICapabilityExtension[]) => extensions,
      inject: capabilityProviders, // Inject only ACTION extensions
    },

    // TODO: Add a PERCEPTION_EXTENSION provider if needed for multi-injection later
  ],
  // Export the capability token and ALL individual extensions
  // If something needs to inject a specific perception extension, it can do so directly by class.
  exports: [CAPABILITY_EXTENSION, ...capabilityProviders, ...perceptionProviders],
})
export class ExtensionsModule {}
