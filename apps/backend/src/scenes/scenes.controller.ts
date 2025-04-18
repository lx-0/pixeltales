import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import {
  CommentPayload,
  CreateSceneConfigDTO,
  SceneConfigResponse,
  SceneConfigResponseSchema,
  VotePayload,
} from '@pixeltales/contracts';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
import { Public } from '../auth/decorators/public.decorator';
import { ScenesService } from './scenes.service';

@Controller('scenes')
@Public()
@UsePipes(ZodValidationPipe)
export class ScenesController {
  constructor(
    private readonly scenesService: ScenesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScenesController.name);
  }

  @Get('/proposed')
  async getProposedScenes(): Promise<SceneConfigResponse[]> {
    this.logger.info(`[${ScenesController.name}] Getting proposed scenes`);
    const proposals = await this.scenesService.getProposals();
    const parsed = z.array(SceneConfigResponseSchema).safeParse(proposals);
    if (!parsed.success) {
      this.logger.error('Failed to parse proposed scenes response', parsed.error);
      throw new Error('Internal server error parsing response');
    }
    return parsed.data;
  }

  @Get('/:sceneConfigId')
  async getSceneConfig(
    @Param('sceneConfigId') sceneConfigId: number,
  ): Promise<SceneConfigResponse> {
    this.logger.info(`[${ScenesController.name}] Getting scene config: ${sceneConfigId}`);
    const scene = await this.scenesService.getById(sceneConfigId);
    if (!scene) {
      throw new NotFoundException('Scene config not found');
    }
    return scene;
  }

  @Post('/propose')
  async proposeScene(@Body() sceneConfigDto: CreateSceneConfigDTO): Promise<SceneConfigResponse> {
    this.logger.info(`[${ScenesController.name}] Proposing new scene: ${sceneConfigDto.name}`);
    return this.scenesService.createProposal(sceneConfigDto);
  }

  @Post('/:sceneConfigId/vote')
  @HttpCode(HttpStatus.OK)
  async voteScene(
    @Param('sceneConfigId') sceneConfigId: number,
    @Body() payload: VotePayload,
  ): Promise<SceneConfigResponse> {
    this.logger.info(
      `[${ScenesController.name}] Voting on scene ${sceneConfigId}: ${payload.vote}`,
    );
    return this.scenesService.vote(sceneConfigId, payload.vote);
  }

  @Post('/:sceneConfigId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectScene(@Param('sceneConfigId') sceneConfigId: number): Promise<void> {
    this.logger.info(`[${ScenesController.name}] Rejecting scene ${sceneConfigId}`);
    await this.scenesService.reject(sceneConfigId);
  }

  @Post('/:sceneConfigId/comment')
  @HttpCode(HttpStatus.NO_CONTENT)
  async addComment(
    @Param('sceneConfigId') sceneConfigId: number,
    @Body() payload: CommentPayload,
  ): Promise<void> {
    this.logger.info(
      `[${ScenesController.name}] Adding comment to scene ${sceneConfigId} by ${payload.user}`,
    );
    await this.scenesService.addComment(sceneConfigId, payload.user, payload.comment);
  }
}
