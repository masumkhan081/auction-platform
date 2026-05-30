import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  SignUploadRequestSchema,
  type SignUploadResponse,
} from '@auction/shared';
import { ZodBody } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/auth.types';
import { type UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Roles('SELLER')
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  sign(
    @CurrentUser() user: RequestUser,
    @ZodBody(SignUploadRequestSchema) body: typeof SignUploadRequestSchema._type,
  ): SignUploadResponse {
    return this.uploads.signForUser({ userId: user.id, request: body });
  }
}
