import { Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from './database.tokens';

@Injectable()
export class DatabaseService {
  constructor(@Inject(SUPABASE_ADMIN) readonly client: SupabaseClient) {}
}
