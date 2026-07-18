// Digital-signature/PKI verification provider — DocuSign eSignature REST API
// adapter for the M2-12 committee/decision-dossier flow.
// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049.
//
// SHORT-TERM PROVIDER by design. The real Saudi PKI authority for this
// domain is trust-service-provider grade (e.g. "emdha"), enterprise-only
// onboarding — not obtainable for a staging/dev cycle. DocuSign's free
// developer sandbox (demo.docusign.net) is the cheapest genuine
// authorization-code-grant signature API available for the ~1-week window
// this build needs; production MUST rotate to the real KSA PKI/EBDA
// provider before go-live (never treat this as the production signer).
//
// Fail-closed by contract: with no DOCUSIGN_* env vars configured, this
// adapter is not constructed and verification honestly resolves to
// 'unavailable' (see resolveVerification in lib/committee/signature.ts) —
// never fabricated as 'verified'. With credentials it calls the real
// DocuSign OAuth + eSignature APIs and only reports 'pending'/'verified'
// on genuine API responses (envelope actually created / actually completed).
import type { VerificationStatus } from "@/lib/committee/signature";

export interface DocuSignConfig {
  integrationKey: string;
  clientSecret: string;
  refreshToken: string;
  accountId: string;
  baseUri: string; // e.g. https://demo.docusign.net
  authServer: string; // e.g. account-d.docusign.com
}

export interface SignatureRequestResult {
  ok: boolean;
  envelopeId?: string;
  providerStatus?: string; // raw DocuSign envelope status
  reason?: string;
}

export interface EnvelopeStatusResult {
  ok: boolean;
  providerStatus?: string;
  reason?: string;
}

/** DocuSign envelope status → the platform's honest VerificationStatus vocabulary.
 *  'sent'/'delivered'/'created' are genuinely in-flight, not fabricated completions. */
export function mapEnvelopeStatusToVerification(providerStatus: string | undefined): VerificationStatus {
  switch (providerStatus) {
    case "completed": return "verified";
    case "declined":
    case "voided": return "failed";
    case "sent":
    case "delivered":
    case "created": return "pending";
    default: return "unavailable";
  }
}

export class DocuSignSignatureAdapter {
  constructor(private readonly cfg: DocuSignConfig) {}

  private async getAccessToken(): Promise<string | null> {
    try {
      const basic = Buffer.from(`${this.cfg.integrationKey}:${this.cfg.clientSecret}`).toString("base64");
      const res = await fetch(`https://${this.cfg.authServer}/oauth/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.cfg.refreshToken,
        }).toString(),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string };
      return data.access_token ?? null;
    } catch {
      return null;
    }
  }

  /** Creates a real DocuSign envelope for a report hash, one signer, one
   *  signHere tab. Returns the genuine envelopeId + provider-reported status
   *  ('sent' on success) — never a synthesized/fabricated result. */
  async requestSignature(input: {
    reportHash: string;
    signerEmail: string;
    signerName: string;
  }): Promise<SignatureRequestResult> {
    const token = await this.getAccessToken();
    if (!token) return { ok: false, reason: "docusign_auth_failed" };
    const documentBase64 = Buffer.from(
      `MIM Inspection Platform — Committee Decision Record\n\nReport hash: ${input.reportHash}\n\nBy signing below you attest to this decision record.`,
      "utf-8",
    ).toString("base64");
    const envelopeDef = {
      emailSubject: "MIM Inspection — committee decision signature",
      status: "sent",
      documents: [
        {
          documentBase64,
          name: "decision-record.txt",
          fileExtension: "txt",
          documentId: "1",
        },
      ],
      recipients: {
        signers: [
          {
            email: input.signerEmail,
            name: input.signerName,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                { anchorString: "signing below", anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "-20" },
              ],
            },
          },
        ],
      },
    };
    try {
      const res = await fetch(
        `${this.cfg.baseUri}/restapi/v2.1/accounts/${this.cfg.accountId}/envelopes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(envelopeDef),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { ok: false, reason: `docusign_${res.status}:${detail.slice(0, 120)}` };
      }
      const data = (await res.json()) as { envelopeId?: string; status?: string };
      if (!data.envelopeId) return { ok: false, reason: "docusign_no_envelope_id" };
      return { ok: true, envelopeId: data.envelopeId, providerStatus: data.status };
    } catch {
      return { ok: false, reason: "docusign_network_error" };
    }
  }

  /** Reads the genuine current status of a previously-created envelope. */
  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    const token = await this.getAccessToken();
    if (!token) return { ok: false, reason: "docusign_auth_failed" };
    try {
      const res = await fetch(
        `${this.cfg.baseUri}/restapi/v2.1/accounts/${this.cfg.accountId}/envelopes/${envelopeId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { ok: false, reason: `docusign_${res.status}:${detail.slice(0, 120)}` };
      }
      const data = (await res.json()) as { status?: string };
      return { ok: true, providerStatus: data.status };
    } catch {
      return { ok: false, reason: "docusign_network_error" };
    }
  }

  /** Voids an envelope — used to keep sandbox state clean after a live
   *  certification run and, more importantly, as a second genuine API call
   *  proving the adapter's write path also actually works. */
  async voidEnvelope(envelopeId: string, reason: string): Promise<{ ok: boolean; reason?: string }> {
    const token = await this.getAccessToken();
    if (!token) return { ok: false, reason: "docusign_auth_failed" };
    try {
      const res = await fetch(
        `${this.cfg.baseUri}/restapi/v2.1/accounts/${this.cfg.accountId}/envelopes/${envelopeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "voided", voidedReason: reason }),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { ok: false, reason: `docusign_${res.status}:${detail.slice(0, 120)}` };
      }
      return { ok: true };
    } catch {
      return { ok: false, reason: "docusign_network_error" };
    }
  }
}

/** Builds the adapter iff every required env var is present — fail-closed
 *  by construction, mirroring the other MVP2 provider gates. */
export function maybeBuildDocuSignAdapter(): DocuSignSignatureAdapter | null {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const clientSecret = process.env.DOCUSIGN_CLIENT_SECRET;
  const refreshToken = process.env.DOCUSIGN_REFRESH_TOKEN;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const baseUri = process.env.DOCUSIGN_BASE_URI;
  const authServer = process.env.DOCUSIGN_AUTH_SERVER;
  if (!integrationKey || !clientSecret || !refreshToken || !accountId || !baseUri || !authServer) return null;
  return new DocuSignSignatureAdapter({ integrationKey, clientSecret, refreshToken, accountId, baseUri, authServer });
}
