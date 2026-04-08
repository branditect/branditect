import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://alzqwhkkntfritasizzx.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsenF3aGtrbnRmcml0YXNpenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDIwMzQsImV4cCI6MjA5MDYxODAzNH0.rnOj0oZ5urAQndVAgaNniUKoith7Zl0X3hag7kS5Jq8"
);

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function buildBrandContext(brandId: string): Promise<string> {
  if (!brandId || brandId === "default") return "";

  const [strategyRes, toneRes, productsRes, docsRes] = await Promise.all([
    supabase
      .from("brand_strategies")
      .select("generated_strategy")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("brand_tone")
      .select(
        "expression_label, expression_text, pillars, dos, donts, vocab_yes, vocab_no"
      )
      .eq("brand_id", brandId)
      .maybeSingle(),
    supabase
      .from("catalog_products")
      .select(
        "type, name, description, price_rrp, price_monthly, price_model, inclusions, ideal_client, delivery_time, category"
      )
      .eq("brand_id", brandId)
      .order("sort_order"),
    supabase
      .from("brand_documents")
      .select("file_name, extracted_text")
      .eq("brand_id", brandId)
      .eq("status", "ready"),
  ]);

  const sections: string[] = [];

  // 1. Brand Strategy
  if (strategyRes.data?.generated_strategy) {
    let strategyText = "";
    try {
      const s = JSON.parse(strategyRes.data.generated_strategy) as Record<string, any>;
      const lines: string[] = [];
      if (s.brandName) lines.push(`Brand: ${s.brandName}`);
      if (s.passport?.purpose) lines.push(`Purpose: ${s.passport.purpose}`);
      if (s.passport?.promise) lines.push(`Promise: ${s.passport.promise}`);
      if (s.passport?.philosophy) lines.push(`Philosophy: ${s.passport.philosophy}`);
      if (s.passport?.values) lines.push(`Values: ${s.passport.values}`);
      if (s.passport?.targetGroup) lines.push(`Target group: ${s.passport.targetGroup}`);
      if (s.passport?.onlyWeClaim) lines.push(`Differentiator: ${s.passport.onlyWeClaim}`);
      if (s.pyramid?.essence) lines.push(`Brand essence: ${s.pyramid.essence}`);
      if (s.pyramid?.behavior) lines.push(`Brand personality: ${s.pyramid.behavior}`);
      if (s.solution) lines.push(`Solution: ${s.solution}`);
      if (s.firstTo?.claim) lines.push(`First to: ${s.firstTo.claim}`);
      if (s.onlyOnesWho?.claim) lines.push(`Only ones who: ${s.onlyOnesWho.claim}`);
      if (s.differentiators?.length) {
        lines.push(
          `Differentiators: ${s.differentiators
            .map((d: any) => `${d.title} — ${d.text}`)
            .join(" | ")}`
        );
      }
      if (s.messagingPillars?.length) {
        lines.push(
          `Messaging pillars: ${s.messagingPillars
            .map((p: any) => `${p.title} — ${p.text}`)
            .join(" | ")}`
        );
      }
      if (s.taglines?.length) {
        lines.push(`Taglines: ${s.taglines.map((t: any) => t.text).join(" / ")}`);
      }
      if (s.voiceDescription) lines.push(`Brand voice: ${s.voiceDescription}`);
      strategyText = lines.join("\n");
    } catch {
      strategyText = strategyRes.data.generated_strategy.slice(0, 3000);
    }
    if (strategyText) {
      sections.push(`=== BRAND STRATEGY ===\n${strategyText}`);
    }
  }

  // 2. Brand Tone of Voice
  if (toneRes.data) {
    const t = toneRes.data as Record<string, any>;
    const lines: string[] = [];
    if (t.expression_label) lines.push(`Voice: ${t.expression_label}`);
    if (t.expression_text) lines.push(`Voice description: ${t.expression_text}`);
    if (Array.isArray(t.pillars) && t.pillars.length) {
      lines.push(
        `Tone pillars: ${t.pillars
          .map((p: { name: string; description?: string }) =>
            p.description ? `${p.name} (${p.description})` : p.name
          )
          .join(", ")}`
      );
    }
    if (Array.isArray(t.dos) && t.dos.length) {
      lines.push(`Tone do: ${t.dos.join("; ")}`);
    }
    if (Array.isArray(t.donts) && t.donts.length) {
      lines.push(`Tone don't: ${t.donts.join("; ")}`);
    }
    if (Array.isArray(t.vocab_yes) && t.vocab_yes.length) {
      lines.push(`Use these words: ${t.vocab_yes.join(", ")}`);
    }
    if (Array.isArray(t.vocab_no) && t.vocab_no.length) {
      lines.push(`Avoid these words: ${t.vocab_no.join(", ")}`);
    }
    if (lines.length) {
      sections.push(`=== BRAND TONE OF VOICE ===\n${lines.join("\n")}`);
    }
  }

  // 3. Products & Services Catalogue
  if (productsRes.data && productsRes.data.length > 0) {
    const productLines = productsRes.data.map((p: any) => {
      const parts: string[] = [`${p.name} (${p.type})`];
      if (p.description) parts.push(p.description);
      if (p.category) parts.push(`Category: ${p.category}`);
      if (p.price_rrp) parts.push(`Price: ${p.price_rrp}`);
      else if (p.price_monthly) parts.push(`Monthly price: ${p.price_monthly}`);
      if (p.price_model) parts.push(`Pricing model: ${p.price_model}`);
      if (Array.isArray(p.inclusions) && p.inclusions.length) {
        parts.push(`Includes: ${p.inclusions.join(", ")}`);
      }
      if (Array.isArray(p.ideal_client) && p.ideal_client.length) {
        parts.push(`Ideal client: ${p.ideal_client.join(", ")}`);
      }
      if (p.delivery_time) parts.push(`Delivery: ${p.delivery_time}`);
      return `- ${parts.join(" | ")}`;
    });
    sections.push(`=== PRODUCTS & SERVICES CATALOGUE ===\n${productLines.join("\n")}`);
  }

  // 4. Brand Knowledge Vault
  if (docsRes.data && docsRes.data.length > 0) {
    const vaultParts = docsRes.data
      .filter((d: any) => d.extracted_text)
      .map((d: any) => `[Source: ${d.file_name}]\n${d.extracted_text}`);
    if (vaultParts.length) {
      // Cap vault text to 20k chars to avoid token overflow
      const combined = vaultParts.join("\n\n---\n\n");
      sections.push(
        `=== BRAND KNOWLEDGE VAULT ===\n${combined.slice(0, 20000)}${combined.length > 20000 ? "\n[…vault truncated for length]" : ""}`
      );
    }
  }

  return sections.join("\n\n");
}

export const STRICT_GENERATION_RULE = `STRICT RULE: You are writing on behalf of this brand. Only use information explicitly stated in the Brand Strategy, Brand Tone of Voice, Products & Services Catalogue, and Brand Knowledge Vault provided below. Never invent product names, features, prices, team members, dates, or company facts. Write in the exact tone of voice described — match the personality, language style, and communication patterns specified. If information needed for this task is not present in any of the four sources below, respond with: "I don't have this information in the vault — please add a document with this detail." Do not guess or extrapolate.`;
