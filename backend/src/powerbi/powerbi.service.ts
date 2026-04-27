import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { MAX_ROWS_LIMIT } from '../common/constants';
import type { AxiosError } from 'axios';

interface CachedToken {
  token: string;
  expiresAt: number;
}

export type RefreshState = 'Unknown' | 'Completed' | 'InProgress' | 'Failed';

export interface PbiTableInfo {
  name: string;
  columns: { name: string; dataType?: string }[];
}

export interface ExecuteResult {
  columns: { name: string; dataType?: string }[];
  rows: Record<string, unknown>[];
  daxUsed: string;
  tableUsed: string;
}

@Injectable()
export class PowerBiService {
  private readonly logger = new Logger(PowerBiService.name);
  private readonly http: AxiosInstance;
  private tokenCache: CachedToken | null = null;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: 'https://api.powerbi.com/v1.0/myorg',
      timeout: 120000,
    });
  }

  private get groupId(): string {
    return this.config.getOrThrow<string>('POWERBI_GROUP_ID');
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 30_000) {
      return this.tokenCache.token;
    }
    const tenant = this.config.getOrThrow<string>('TENANT_ID');
    const clientId = this.config.getOrThrow<string>('CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('CLIENT_SECRET');
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
    });
    try {
      const { data } = await axios.post<{
        access_token: string;
        expires_in: number;
      }>(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      this.tokenCache = {
        token: data.access_token,
        expiresAt: now + (data.expires_in - 60) * 1000,
      };
      return data.access_token;
    } catch (e: unknown) {
      this.logger.error('Azure AD token failed', e);
      throw new ServiceUnavailableException(
        'Could not acquire Power BI access token. Check TENANT_ID, CLIENT_ID, CLIENT_SECRET.',
      );
    }
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const t = await this.getAccessToken();
    return { Authorization: `Bearer ${t}` };
  }

  private powerBiErrorToMessage(e: unknown): string {
    const err = e as AxiosError<any>;
    const status = err?.response?.status;
    const data = err?.response?.data;
    if (status === 401 || status === 403) {
      return `Power BI authorization failed (${status}). Ensure the service principal is allowed in your tenant, has admin-consented permissions, and is added to the workspace/group with dataset Build permission. Response: ${JSON.stringify(
        data ?? {},
      )}`;
    }
    if (status) {
      return `Power BI request failed (${status}). Response: ${JSON.stringify(
        data ?? {},
      )}`;
    }
    return `Power BI request failed: ${String(err?.message ?? e)}`;
  }

  async listWorkspaces(): Promise<{ id: string; name: string }[]> {
    try {
      const { data } = await this.http.get<{ value: { id: string; name: string }[] }>(
        '/groups',
        { headers: await this.authHeaders() },
      );
      return (data.value ?? []).map((g) => ({ id: g.id, name: g.name }));
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  async listDatasets(workspaceId?: string): Promise<
    { id: string; name: string; configuredBy?: string; isRefreshable?: boolean }[]
  > {
    const gid = workspaceId ?? this.groupId;
    try {
      const { data } = await this.http.get<{
        value: {
          id: string;
          name: string;
          configuredBy?: string;
          isRefreshable?: boolean;
        }[];
      }>(`/groups/${gid}/datasets`, { headers: await this.authHeaders() });
      return data.value ?? [];
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  async getTables(datasetId: string, workspaceId?: string): Promise<PbiTableInfo[]> {
    const gid = workspaceId ?? this.groupId;
    try {
      const { data } = await this.http.get<{
        value: { name: string; columns?: { name: string; dataType?: string }[] }[];
      }>(`/groups/${gid}/datasets/${datasetId}/tables`, {
        headers: await this.authHeaders(),
      });
      return (data.value ?? []).map((t) => ({
        name: t.name,
        columns: (t.columns ?? []).map((c) => ({
          name: c.name,
          dataType: c.dataType,
        })),
      }));
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  escapeDaxTable(name: string): string {
    return `'${name.replace(/'/g, "''")}'`;
  }

  async executeDax(
    datasetId: string,
    dax: string,
    workspaceId?: string,
  ): Promise<ExecuteResult> {
    const gid = workspaceId ?? this.groupId;
    try {
      const { data } = await this.http.post<{
        results?: {
          tables?: {
            rows?: Record<string, unknown>[];
            columns?: { name: string; dataType?: string }[];
          }[];
        }[];
      }>(
        `/groups/${gid}/datasets/${datasetId}/executeQueries`,
        {
          queries: [{ query: dax }],
          serializerSettings: { includeNulls: true },
        },
        { headers: await this.authHeaders() },
      );
      const table = data.results?.[0]?.tables?.[0];
      const rows = table?.rows ?? [];
      const columns = table?.columns ?? [];
      return {
        columns,
        rows,
        daxUsed: dax,
        tableUsed: '',
      };
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  /**
   * Fetch tabular data using TOPN on real model tables — no silent filtering beyond row cap.
   */
  async fetchDatasetSample(
    datasetId: string,
    workspaceId?: string,
    maxRows = MAX_ROWS_LIMIT,
  ): Promise<ExecuteResult & { warnings: string[] }> {
    const warnings: string[] = [];
    const tables = await this.getTables(datasetId, workspaceId);
    if (!tables.length) {
      throw new ServiceUnavailableException('No tables found in dataset model');
    }
    const ordered = [...tables].sort((a, b) => b.columns.length - a.columns.length);
    let lastErr: unknown;
    for (const t of ordered) {
      const dax = `EVALUATE TOPN(${maxRows}, ${this.escapeDaxTable(t.name)})`;
      try {
        const res = await this.executeDax(datasetId, dax, workspaceId);
        return { ...res, tableUsed: t.name, warnings };
      } catch (e) {
        lastErr = e;
        this.logger.warn(`DAX failed for ${t.name}, trying next table`);
      }
    }
    this.logger.error('All table queries failed', lastErr);
    throw new ServiceUnavailableException(
      'Could not execute DAX against this dataset. Verify service principal has Build permissions.',
    );
  }

  async getRefreshHistory(datasetId: string, workspaceId?: string) {
    const gid = workspaceId ?? this.groupId;
    try {
      const { data } = await this.http.get<{
        value?: {
          id?: string;
          status?: string;
          serviceExceptionJson?: string;
          startTime?: string;
          endTime?: string;
        }[];
      }>(`/groups/${gid}/datasets/${datasetId}/refreshes`, {
        headers: await this.authHeaders(),
      });
      return data.value ?? [];
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  /**
   * Latest refresh entry — Power BI returns most recent first in many tenants.
   */
  async getLatestRefreshStatus(
    datasetId: string,
    workspaceId?: string,
  ): Promise<{
    status: RefreshState;
    startTime?: string;
    endTime?: string;
    message?: string;
  }> {
    const list = await this.getRefreshHistory(datasetId, workspaceId);
    const latest = list[0];
    if (!latest) {
      return { status: 'Unknown' };
    }
    const s = (latest.status ?? '').toLowerCase();
    let status: RefreshState = 'Unknown';
    if (s === 'completed') status = 'Completed';
    else if (s === 'inprogress' || s === 'unknown') status = 'InProgress';
    else if (s === 'failed') status = 'Failed';
    return {
      status,
      startTime: latest.startTime,
      endTime: latest.endTime,
      message: latest.serviceExceptionJson,
    };
  }

  async triggerRefresh(datasetId: string, workspaceId?: string): Promise<void> {
    const gid = workspaceId ?? this.groupId;
    try {
      await this.http.post(
        `/groups/${gid}/datasets/${datasetId}/refreshes`,
        { notifyOption: 'MailOnFailure' },
        { headers: await this.authHeaders() },
      );
    } catch (e) {
      throw new ServiceUnavailableException(this.powerBiErrorToMessage(e));
    }
  }

  async waitForRefreshComplete(
    datasetId: string,
    workspaceId?: string,
    maxWaitMs = 20000,
  ): Promise<{ completed: boolean; status: RefreshState }> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const st = await this.getLatestRefreshStatus(datasetId, workspaceId);
      if (st.status === 'Completed' || st.status === 'Failed') {
        return { completed: true, status: st.status };
      }
      if (st.status === 'InProgress' || st.status === 'Unknown') {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      break;
    }
    const st = await this.getLatestRefreshStatus(datasetId, workspaceId);
    return { completed: false, status: st.status };
  }
}
