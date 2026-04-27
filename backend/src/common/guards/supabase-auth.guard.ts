import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';

export interface AuthedRequest extends Request {
  user?: { id: string; email?: string };
  supabase?: SupabaseClient;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private admin!: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) {
      this.admin = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = auth.slice(7).trim();
    if (!this.admin) {
      throw new UnauthorizedException('Auth not configured');
    }
    const { data, error } = await this.admin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    req.user = { id: data.user.id, email: data.user.email ?? undefined };
    req.supabase = this.admin;
    return true;
  }
}
