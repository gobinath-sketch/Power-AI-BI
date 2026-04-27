import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { EmailService } from './email.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

class TestBody {
  @IsEmail()
  to!: string;
}

@Controller('email')
@UseGuards(SupabaseAuthGuard)
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('test')
  test(@Body() body: TestBody) {
    return this.email.sendTest(body.to);
  }
}
