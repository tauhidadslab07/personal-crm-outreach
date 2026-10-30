import { NextRequest, NextResponse } from 'next/server';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from '@/lib/phone';
import { classifyLeadNiche } from '@/lib/classifier';
import { extractDomain } from '@/lib/domain';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Handle CORS Preflight from Chrome Extensions
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}

// Health check and documentation endpoint
export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      crm: 'Nexus CRM Outreach Engine',
      endpoint: '/api/leads',
      supportedMethods: ['POST', 'GET'],
      acceptedFields: {
        name: 'Business name or contact person (required)',
        phone: 'Phone or WhatsApp number with or without country code (required)',
        website: 'Website domain or URL (optional, pass null if none or maps link)',
        company: 'Company / Agency name (optional)',
        email: 'Email address (optional)',
        niche: "'Website Development Agency' | 'Website Developer' (optional, auto-detected)",
        rating: 'Google rating e.g. 4.8 (optional)',
        notes: 'Address, Maps URL, or notes (optional)',
        source: 'Default: "Chrome Extension"',
      },
      corsEnabled: true,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

// Ingest leads from Chrome Extension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leadsInput = Array.isArray(body) ? body : [body];

    const today = new Date().toISOString().slice(0, 10);

    const processedLeads = leadsInput
      .map((input: any, index: number) => {
        const name = (
          input.name ||
          input.business_name ||
          input.businessName ||
          input.client_name ||
          input.title ||
          ''
        ).trim();

        const rawPhone = (
          input.phone ||
          input.phone_number ||
          input.phoneNumber ||
          input.whatsapp ||
          input.phoneRaw ||
          ''
        ).trim();

        if (!name && !rawPhone) return null;

        const phoneInfo = parsePhoneAndDetectCountry(rawPhone);
        const sanitizedPhone = sanitizePhoneForWhatsApp(phoneInfo.e164 || rawPhone);

        const rawWebsite =
          input.website || input.domain || input.site || input.url || input.web;
        const cleanWebDomain = extractDomain(rawWebsite);

        const company = (
          input.company ||
          input.company_name ||
          input.agency ||
          name
        ).trim();

        const niche =
          input.niche ||
          classifyLeadNiche({
            name,
            company,
            website: cleanWebDomain,
            raw: `${name} ${company}`,
          });

        const id = `lead-ext-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;

        return {
          id,
          name: name || `Lead ${sanitizedPhone ? sanitizedPhone.slice(-4) : 'Prospect'}`,
          company: company || undefined,
          phoneRaw: rawPhone,
          phoneSanitized: sanitizedPhone,
          isoCode: phoneInfo.isoCode || 'BD',
          countryCode: phoneInfo.countryCode || '+880',
          countryName: phoneInfo.countryName || 'Bangladesh',
          flagEmoji: phoneInfo.flagEmoji || '🇧🇩',
          website: cleanWebDomain || undefined, // undefined renders as null in CRM
          email: (input.email || '').trim() || undefined,
          source: input.source || 'Chrome Extension',
          niche,
          currentStage: 0,
          killSwitchStatus: 'active' as const,
          isQueuedForToday: false, // Ingested safely into Leads Pool
          tags: ['Extension Scraped', niche === 'Website Development Agency' ? 'Agency' : 'Dev'],
          notes: (input.notes || input.address || input.mapsUrl || input.maps_url || '').trim() || undefined,
          createdAt: today,
          updatedAt: today,
        };
      })
      .filter(Boolean);

    // If Supabase is connected, sync leads
    if (isSupabaseConfigured && supabase && processedLeads.length > 0) {
      try {
        const supabaseRows = processedLeads.map((l: any) => ({
          name: l.name,
          phone: l.phoneRaw,
          iso_code: l.isoCode,
          country_code: l.countryCode,
          country_name: l.countryName,
          source: l.source,
          current_stage: 0,
          status: 'active',
          notes: l.website ? `Website: ${l.website}` : undefined,
        }));
        await supabase.from('leads').upsert(supabaseRows, { onConflict: 'phone' });
      } catch (e) {
        console.warn('Supabase background sync notice:', e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully processed ${processedLeads.length} lead(s) for Nexus CRM`,
        count: processedLeads.length,
        leads: processedLeads,
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Invalid JSON request body',
      },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
