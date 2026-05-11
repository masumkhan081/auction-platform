import { Controller, Delete, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import {
  UpdateProfileRequestSchema,
  type ProfileDto,
} from '@auction/shared';
import { ZodBody } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('me')
  getOwn(@CurrentUser() user: RequestUser): Promise<ProfileDto> {
    return this.profile.getOwn(user.id);
  }

  @Patch('me')
  updateOwn(
    @CurrentUser() user: RequestUser,
    @ZodBody(UpdateProfileRequestSchema) body: typeof UpdateProfileRequestSchema._type,
  ): Promise<ProfileDto> {
    return this.profile.updateOwn(user.id, body);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivateOwn(@CurrentUser() user: RequestUser): Promise<void> {
    return this.profile.deactivateOwn(user.id);
  }
}
