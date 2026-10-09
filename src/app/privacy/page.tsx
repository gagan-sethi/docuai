import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import {
  GOVERNING_LAW,
  LEGAL_ENTITY,
  REGISTERED_ADDRESS,
  RETENTION,
  STORAGE_REGION,
  SUB_PROCESSORS,
} from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: "Privacy Policy – Invonix",
  description:
    "How Invonix collects, processes, stores and shares the documents and personal data you entrust to us, including our sub-processors and retention periods.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${LEGAL_ENTITY} does with the documents you upload and the personal data you give us. It is written to meet the UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL), and it covers the GDPR rights of customers in the EU and UK.`}
    >
      <h2>1. Who we are</h2>
      <p>
        {LEGAL_ENTITY} operates the Invonix finance automation platform at{" "}
        {REGISTERED_ADDRESS}. For the personal data in your own documents and
        workspace you are the <strong>controller</strong> and we act as your{" "}
        <strong>processor</strong>. For your account, billing and support data we
        are the controller.
      </p>
      <p>
        Privacy questions go to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We answer data
        subject requests within 30 days.
      </p>

      <h2>2. What we collect</h2>
      <h3>Data you give us</h3>
      <ul>
        <li>
          <strong>Account details</strong> — name, work email, mobile number,
          company name, password (stored only as a bcrypt hash).
        </li>
        <li>
          <strong>Workspace content</strong> — the invoices, receipts, purchase
          orders and other files you upload, plus everything our AI extracts
          from them: supplier names, tax registration numbers, line items,
          totals, VAT amounts and dates.
        </li>
        <li>
          <strong>Billing details</strong> — billing name, email and
          subscription history. Card numbers are entered directly into Stripe
          and never reach our servers.
        </li>
        <li>
          <strong>Support messages</strong> — the tickets and attachments you
          send us.
        </li>
      </ul>
      <h3>Data we generate</h3>
      <ul>
        <li>
          <strong>Usage and audit records</strong> — logins, uploads, approvals,
          exports and plan changes, with timestamp and IP address. We keep these
          to secure your account and to show you an activity history.
        </li>
        <li>
          <strong>Service logs</strong> — technical logs needed to diagnose
          errors.
        </li>
      </ul>

      <h2>3. Why we process it</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Purpose</th>
              <th>Legal basis (PDPL / GDPR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Running the platform: OCR, AI extraction, reports, exports</td>
              <td>Performance of our contract with you</td>
            </tr>
            <tr>
              <td>Billing, invoicing and collecting payment</td>
              <td>Performance of contract; legal obligation</td>
            </tr>
            <tr>
              <td>Account security, fraud and abuse prevention, audit logs</td>
              <td>Legitimate interest in a secure service</td>
            </tr>
            <tr>
              <td>Service emails: verification, limits, receipts</td>
              <td>Performance of contract</td>
            </tr>
            <tr>
              <td>Product and marketing emails</td>
              <td>Your consent, withdrawable at any time</td>
            </tr>
            <tr>
              <td>Tax and accounting record keeping</td>
              <td>Legal obligation</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We do not sell personal data, and we do not use your documents or the
        data extracted from them to train our own or anyone else&apos;s AI
        models.
      </p>

      <h2>4. Who we share it with</h2>
      <p>
        Processing a document necessarily involves third-party services. Every
        party that receives customer content is listed here:
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Sub-processor</th>
              <th>What it does</th>
              <th>Where</th>
              <th>What it receives</th>
            </tr>
          </thead>
          <tbody>
            {SUB_PROCESSORS.map((processor) => (
              <tr key={processor.name}>
                <td>
                  <strong>{processor.name}</strong>
                </td>
                <td>{processor.purpose}</td>
                <td>{processor.location}</td>
                <td>{processor.dataShared}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        We also disclose data where the law compels us to, and to a buyer if the
        business is sold — in which case this policy continues to apply until we
        give you notice of any change. Nobody else receives your data.
      </p>

      <h2>5. Where your data is stored and transferred</h2>
      <p>
        Documents and extracted data are stored in{" "}
        <strong>{STORAGE_REGION}</strong>. Some of the sub-processors above
        process data outside the UAE, including in the United States and the
        European Union. Those transfers rely on the recipient&apos;s standard
        contractual clauses and data processing terms, which we have entered
        into for each service. If you need your data to stay in a specific
        jurisdiction, contact us before you upload.
      </p>

      <h2>6. How long we keep it</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION.map((row) => (
              <tr key={row.item}>
                <td>{row.item}</td>
                <td>{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>7. How we protect it</h2>
      <ul>
        <li>Encryption in transit (TLS) and at rest.</li>
        <li>
          Document files are stored privately. Downloads go through short-lived
          signed links; the storage URLs are not publicly readable.
        </li>
        <li>
          Passwords are hashed with bcrypt and are never recoverable in plain
          text.
        </li>
        <li>
          Access inside your workspace is role-based: owner, admin and member
          see different data.
        </li>
        <li>Administrative access to production is limited and audit-logged.</li>
      </ul>
      <p>
        No system is absolutely secure. If a breach affects your personal data
        we will notify you and the UAE Data Office without undue delay, as the
        PDPL requires.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Subject to the conditions in the PDPL and, where it applies, the GDPR,
        you may ask us to:
      </p>
      <ul>
        <li>give you a copy of your personal data, or export it in a portable format;</li>
        <li>correct data that is wrong or incomplete;</li>
        <li>delete your data, including by closing your account;</li>
        <li>restrict or object to a particular kind of processing;</li>
        <li>withdraw consent to marketing, at any time;</li>
        <li>
          tell you about, or object to, decisions made about you by automated
          means.
        </li>
      </ul>
      <p>
        You can do most of this yourself from{" "}
        <Link href="/dashboard/settings">your account settings</Link>. For
        anything else, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. You also have
        the right to complain to the UAE Data Office, or to your local
        supervisory authority.
      </p>

      <h2>9. Automated processing</h2>
      <p>
        Invonix uses OCR and a large language model to read your documents and
        propose structured fields, a document type and an expense category. It
        assigns a confidence score to each. These are{" "}
        <strong>suggestions, not decisions</strong>: nothing is treated as final
        until a person in your workspace reviews and approves it, and you can
        edit every extracted field. We make no automated decision that has a
        legal effect on an individual.
      </p>

      <h2>10. Children</h2>
      <p>
        Invonix is a business tool and is not intended for anyone under 18. We
        do not knowingly collect data from children.
      </p>

      <h2>11. Cookies</h2>
      <p>
        See our <Link href="/cookies">Cookie Policy</Link> for what we store in
        your browser and why.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We will post any revision on this page and update the effective date. If
        a change materially reduces your rights, we will email account owners at
        least 30 days before it takes effect.
      </p>

      <h2>13. Contact</h2>
      <p>
        {LEGAL_ENTITY}, {REGISTERED_ADDRESS}
        <br />
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
      <p>
        This policy is governed by the laws of {GOVERNING_LAW}.
      </p>
    </LegalPage>
  );
}
