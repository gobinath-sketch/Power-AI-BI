import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from '../scheduler/scheduler.service';

class CreateScheduleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  datasetId!: string;

  @IsOptional()
  @IsString()
  datasetName?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsIn(['daily', 'weekly'])
  frequency!: 'daily' | 'weekly';

  @IsNumber()
  @Min(0)
  @Max(23)
  hourUtc!: number;

  @IsEmail()
  recipientEmail!: string;
}

@Controller('schedules')
@UseGuards(SupabaseAuthGuard)
export class SchedulesController {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerService,
  ) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    const { data } = await this.db.client
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() body: CreateScheduleDto,
  ) {
    const groupId =
      body.groupId ?? this.config.getOrThrow<string>('POWERBI_GROUP_ID');
    const next = this.scheduler.computeNextRun(
      body.frequency,
      body.hourUtc,
      'UTC',
    );
    const { data, error } = await this.db.client
      .from('schedules')
      .insert({
        user_id: user.id,
        title: body.title ?? null,
        dataset_id: body.datasetId,
        dataset_name: body.datasetName ?? null,
        group_id: groupId,
        frequency: body.frequency,
        cron_expr: body.frequency === 'daily' ? '0 * * * *' : '0 * * * 1',
        recipient_email: body.recipientEmail,
        hour_utc: body.hourUtc,
        next_run_at: next,
        enabled: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.db.client
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    return { ok: true };
  }
}
