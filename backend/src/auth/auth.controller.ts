import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  @Get('session')
  @UseGuards(SupabaseAuthGuard)
  session(@CurrentUser() user: { id: string; email?: string }) {
    return { user };
  }
}
