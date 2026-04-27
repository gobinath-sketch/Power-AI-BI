import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChatService } from './chat.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { DatabaseService } from '../database/database.service';

class ChatBody {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsUUID()
  reportId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly db: DatabaseService,
  ) {}

  @Post('query')
  async query(
    @CurrentUser() user: { id: string },
    @Body() body: ChatBody,
  ) {
    let payload = null;
    if (body.reportId) {
      const { data } = await this.db.client
        .from('reports')
        .select('payload')
        .eq('id', body.reportId)
        .eq('user_id', user.id)
        .single();
      payload = data?.payload ?? null;
    }
    const result = await this.chat.answer(body.message, payload);

    if (body.sessionId) {
      const { data: existing } = await this.db.client
        .from('chat_sessions')
        .select('id')
        .eq('id', body.sessionId)
        .eq('user_id', user.id)
        .single();
      if (!existing) {
        throw new BadRequestException('Invalid chat session');
      }
    }

    let sessionId = body.sessionId;
    if (!sessionId) {
      const { data: sess } = await this.db.client
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          report_id: body.reportId ?? null,
        })
        .select('id')
        .single();
      sessionId = sess?.id;
    }
    if (sessionId) {
      await this.db.client.from('chat_messages').insert([
        { session_id: sessionId, role: 'user', content: body.message },
        {
          session_id: sessionId,
          role: 'assistant',
          content: result.reply || result.clarify || '',
          meta: {
            intent: result.intent,
            confidence: result.confidence,
            clarify: result.clarify,
          },
        },
      ]);
    }

    return { ...result, sessionId };
  }

  @Get('sessions/:id/messages')
  async messages(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
  ) {
    const { data: s } = await this.db.client
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (!s) return { messages: [] };
    const { data } = await this.db.client
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return { messages: data ?? [] };
  }
}
