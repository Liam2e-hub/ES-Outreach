/**
 * ES Outreach Generator — Cloudflare Worker
 * Handles three actions:
 *   generate  → calls Anthropic Claude API to write email sequences
 *   research  → calls Claude with web search to research a lead
 *   log_lead  → writes lead data to Notion database
 *
 * Environment variables to set in Cloudflare dashboard:
 *   ANTHROPIC_API_KEY   — your Anthropic API key
 *   NOTION_API_KEY      — your Notion integration token
 *   NOTION_DATABASE_ID  — the Leads & Outreach Tracker database ID
 *   ALLOWED_ORIGIN      — your GitHub Pages URL (e.g. https://yourusername.github.io)
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const NOTION_URL    = 'https://api.notion.com/v1/pages';
const MODEL         = 'claude-sonnet-4-5-20251001';

export default {
  async fetch(request, env) {

    // ── CORS ────────────────────────────────────────────────────────────────
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { action } = body;

      // ── Generate or Research (both call Claude) ─────────────────────────
      if (action === 'generate' || action === 'research') {
        const { prompt } = body;

        const payload = {
          model: MODEL,
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        };

        // Research gets web search tool
        if (action === 'research') {
          payload.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
          payload.max_tokens = 2000;
        }

        const res = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.text();
          return new Response(JSON.stringify({ error: err }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await res.json();

        // Extract text from content blocks (may include tool_use blocks for research)
        const text = data.content
          .filter(b => b.type === 'text')
          .map(b => b.text)
          .join('\n');

        return new Response(JSON.stringify({ text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // ── Log lead to Notion ──────────────────────────────────────────────
      if (action === 'log_lead') {
        const { lead } = body;

        const notionBody = {
          parent: { database_id: env.NOTION_DATABASE_ID },
          properties: {
            'Name':               titleProp(lead.name || 'Unknown'),
            'Business':           textProp(lead.business),
            'Role':               textProp(lead.role),
            'Email':              lead.email ? { email: lead.email } : undefined,
            'Industry':           textProp(lead.industry),
            'Website':            lead.website ? { url: lead.website } : undefined,
            'Lead Type':          selectProp(capitalise(lead.leadType)),
            'Brand Type':         selectProp(lead.brandType),
            'Company Size':       selectProp(lead.companySize),
            'Hook':               selectProp(lead.hook),
            'Connection Context': textProp(lead.context),
            'Pain Point':         textProp(lead.pain),
            'Case Study Used':    textProp(lead.caseStudies),
            'Status':             selectProp('New'),
            'Added Via':          selectProp('Generator App'),
          }
        };

        // Remove undefined properties
        Object.keys(notionBody.properties).forEach(k => {
          if (notionBody.properties[k] === undefined) delete notionBody.properties[k];
        });

        const notionRes = await fetch(NOTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify(notionBody)
        });

        if (!notionRes.ok) {
          const err = await notionRes.text();
          return new Response(JSON.stringify({ error: err }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const notionData = await notionRes.json();
        return new Response(JSON.stringify({ success: true, id: notionData.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// ── Notion property helpers ─────────────────────────────────────────────────
function titleProp(text) {
  return { title: [{ text: { content: text || '' } }] };
}

function textProp(text) {
  if (!text) return undefined;
  return { rich_text: [{ text: { content: text } }] };
}

function selectProp(name) {
  if (!name) return undefined;
  return { select: { name } };
}

function capitalise(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
