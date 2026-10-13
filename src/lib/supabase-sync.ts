import { supabase, isSupabaseConfigured } from './supabase';
import { Lead, CadenceStage, Meeting, Project, Task } from '@/types/crm';

/**
 * Sync lead to Supabase
 */
export async function syncLeadToSupabase(lead: Lead): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const payload = {
      id: lead.id.startsWith('lead-') ? undefined : lead.id, // Only send if valid UUID or let Supabase generate
      name: lead.name,
      phone: lead.phoneRaw,
      iso_code: lead.isoCode,
      country_code: lead.countryCode,
      country_name: lead.countryName,
      source: lead.source,
      current_stage: lead.currentStage,
      status: lead.killSwitchStatus,
      notes: lead.company ? `Company: ${lead.company}` : undefined,
    };

    const { error } = await supabase.from('leads').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase syncLead warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync error:', err);
    return false;
  }
}

/**
 * Fetch all leads from Supabase if any exist
 */
export async function fetchLeadsFromSupabase(): Promise<Lead[] | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase.from('leads').select('*');
    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      phoneRaw: row.phone,
      phoneSanitized: (row.phone || '').replace(/\D/g, ''),
      isoCode: row.iso_code || 'US',
      countryCode: row.country_code || '+1',
      countryName: row.country_name || 'United States',
      flagEmoji: '🌐',
      company: row.notes?.replace('Company: ', '') || undefined,
      source: row.source || 'Other',
      currentStage: row.current_stage || 0,
      killSwitchStatus: row.status || 'active',
      tags: [],
      createdAt: row.created_at || new Date().toISOString().slice(0, 10),
      updatedAt: row.created_at || new Date().toISOString().slice(0, 10),
    }));
  } catch (err) {
    console.warn('Supabase fetchLeads error:', err);
    return null;
  }
}

/**
 * Check connection status and test table accessibility
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  canRead: boolean;
  canWrite: boolean;
  message: string;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      canRead: false,
      canWrite: false,
      message: 'Supabase credentials not configured',
    };
  }

  try {
    // Test Read
    const { error: readErr } = await supabase.from('leads').select('id').limit(1);
    if (readErr) {
      return {
        connected: false,
        canRead: false,
        canWrite: false,
        message: `Read failed: ${readErr.message}`,
      };
    }

    // Test Write (checking RLS)
    const testPayload = {
      name: 'Ping Test',
      phone: '+15550000000',
      iso_code: 'US',
      country_code: '+1',
      country_name: 'United States',
      source: 'Website',
      current_stage: 0,
      status: 'active',
    };
    const { data: writeData, error: writeErr } = await supabase
      .from('leads')
      .insert(testPayload)
      .select('id')
      .single();

    if (writeErr) {
      return {
        connected: true,
        canRead: true,
        canWrite: false,
        message: `Connected (Read OK, Write restricted by RLS: ${writeErr.message})`,
      };
    }

    // Clean up test row
    if (writeData?.id) {
      await supabase.from('leads').delete().eq('id', writeData.id);
    }

    return {
      connected: true,
      canRead: true,
      canWrite: true,
      message: 'Connected with Full Read & Write Access!',
    };
  } catch (err: any) {
    return {
      connected: false,
      canRead: false,
      canWrite: false,
      message: err?.message || 'Connection error',
    };
  }
}
