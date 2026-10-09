import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SUPPORT_EMAIL, TRIAL_DAYS, TRIAL_ENABLED } from "@/lib/siteConfig";
import {
  COURTS,
  GOVERNING_LAW,
  LEGAL_ENTITY,
  REGISTERED_ADDRESS,
  TRADE_LICENCE,
} from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: "Terms of Service – Invonix",
  description:
    "The agreement between you and Invonix: what the service does, what each side is responsible for, how billing and cancellation work, and the limits of our liability.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms are the agreement between you and ${LEGAL_ENTITY} for the use of Invonix. By creating an account you accept them.`}
    >
      <h2>1. The agreement</h2>
      <p>
        These Terms, together with our{" "}
        <Link href="/privacy">Privacy Policy</Link>, govern your use of the
        Invonix platform. If you accept them on behalf of a company, you confirm
        you are authorised to bind that company, and &quot;you&quot; means that
        company.
      </p>
      <p>
        {LEGAL_ENTITY} is established at {REGISTERED_ADDRESS}
        {TRADE_LICENCE ? ` (trade licence ${TRADE_LICENCE})` : ""}.
      </p>

      <h2>2. What the service does</h2>
      <p>
        Invonix reads financial documents you upload — invoices, receipts,
        purchase orders and similar — using OCR and AI, proposes structured
        fields, and produces reports and exports from the data you approve.
      </p>
      <p>
        <strong>Invonix is not an accountant, auditor or tax adviser.</strong>{" "}
        Extraction is probabilistic and every document carries a confidence
        score for exactly that reason. You remain responsible for reviewing
        extracted data before you rely on it, and for the accuracy of any VAT
        return, filing or financial statement you prepare from it. Do not file a
        return from an unreviewed export.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Give accurate registration details and keep them current.</li>
        <li>
          Keep your password confidential. You are responsible for everything
          done under your account and by the teammates you invite.
        </li>
        <li>
          Tell us promptly at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you suspect
          unauthorised access.
        </li>
        <li>
          The workspace owner controls billing, team membership and company
          records for the workspace.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          upload content you have no right to upload, or anyone else&apos;s
          personal data without a lawful basis;
        </li>
        <li>
          upload malware, or attempt to breach, probe or overload the service or
          its infrastructure;
        </li>
        <li>
          reverse engineer the service, resell it, or use it to build a
          competing product;
        </li>
        <li>
          use automated means to extract data beyond the limits of your plan, or
          share one paid seat among several people;
        </li>
        <li>use the service for anything unlawful.</li>
      </ul>
      <p>
        We may suspend an account that breaches this section, and will tell you
        why.
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep all rights in the documents you upload and the data extracted
        from them. You grant us only the licence we need to host, process,
        transmit and display that content in order to run the service for you,
        and to keep backups. That licence ends when you delete the content or
        close your account, except for backup copies that expire on our normal
        cycle (within 30 days).
      </p>
      <p>
        We do not use your content to train AI models, and we do not disclose it
        except as described in the <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>6. Plans, fees and usage limits</h2>
      <ul>
        <li>
          Each plan sets a monthly allowance for documents, pages, users,
          companies and storage. Your current plan and usage are shown on your{" "}
          <Link href="/dashboard/billing">Billing page</Link>, and the published
          allowances are on the <Link href="/pricing">Pricing page</Link>.
        </li>
        <li>
          Fees are stated and charged in the currency shown at checkout,
          exclusive of VAT unless stated otherwise. Where UAE VAT applies it is
          added at the prevailing rate.
        </li>
        <li>
          Subscriptions renew automatically for the same period until cancelled.
          We charge the payment method on file on each renewal date.
        </li>
        <li>
          Exceeding your allowance may pause further processing until the next
          period, until you buy a top-up, or until you upgrade. We will tell you
          before you reach the limit.
        </li>
        <li>
          We may change prices with at least 30 days&apos; notice to account
          owners. The new price applies from your next renewal.
        </li>
      </ul>

      <h2>7. {TRIAL_ENABLED ? "Free trial and free plan" : "Free plan"}</h2>
      {TRIAL_ENABLED ? (
        <p>
          Paid plans include a {TRIAL_DAYS}-day free trial where offered at
          signup. One trial per customer. If you do not cancel before the trial
          ends, the subscription starts and the first period is charged.
        </p>
      ) : (
        <p>
          The free plan is available indefinitely within its published
          allowance, and does not require a payment method. Free-plan features
          and limits may change; we will give notice of any reduction.
        </p>
      )}

      <h2>8. Cancellation and refunds</h2>
      <ul>
        <li>
          You can cancel at any time from your Billing page. Cancellation takes
          effect at the end of the paid period; the service continues until
          then.
        </li>
        <li>
          Fees already paid are not refunded for a partial period, except where
          consumer law requires it or where we have materially failed to provide
          the service.
        </li>
        <li>
          You can export your data at any time while the account is active.
          Export before you close the account — see the retention periods in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </li>
        <li>
          We may terminate for a material breach that is not fixed within 14
          days of notice, or immediately for unlawful use. If we discontinue the
          service, we will give you at least 60 days&apos; notice and a pro-rata
          refund of prepaid fees.
        </li>
      </ul>

      <h2>9. Availability and support</h2>
      <p>
        We aim to keep Invonix available and to fix faults promptly, and we
        provide support by email and through the in-app support centre. We do
        not promise a specific uptime percentage unless we have signed a
        separate service level agreement with you. Planned maintenance is
        announced in advance where practical.
      </p>

      <h2>10. Third-party services</h2>
      <p>
        The service depends on third parties, including cloud storage, OCR, AI
        and payment providers, all of which are listed in the{" "}
        <Link href="/privacy">Privacy Policy</Link>. Their availability is
        outside our control and an outage at one of them may interrupt the
        service.
      </p>

      <h2>11. Intellectual property</h2>
      <p>
        We own the Invonix platform, its software, design and trade marks.
        Nothing in these Terms transfers that ownership. Feedback you send us may
        be used to improve the product without obligation to you.
      </p>

      <h2>12. Disclaimers and liability</h2>
      <p>
        The service is provided on an &quot;as is&quot; basis. To the extent the
        law allows, we exclude implied warranties of merchantability, fitness
        for a particular purpose and non-infringement, and we do not warrant
        that extraction will be error-free or that the service will be
        uninterrupted.
      </p>
      <p>
        To the extent the law allows, neither party is liable for indirect or
        consequential loss, lost profits, lost revenue or lost data, and our
        total liability arising out of or in connection with these Terms is
        limited to the fees you paid us in the 12 months before the event giving
        rise to the claim. Nothing here excludes liability that cannot lawfully
        be excluded, including for fraud or death or personal injury caused by
        negligence.
      </p>

      <h2>13. Indemnity</h2>
      <p>
        You will indemnify us against third-party claims arising from content
        you upload in breach of these Terms, or from your unlawful use of the
        service.
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms. We will post the revision here and update the
        effective date, and we will email account owners at least 30 days before
        a material change takes effect. Continuing to use the service after that
        date means you accept the new Terms.
      </p>

      <h2>15. Governing law</h2>
      <p>
        These Terms are governed by the laws of {GOVERNING_LAW}, and the parties
        submit to the exclusive jurisdiction of {COURTS}.
      </p>

      <h2>16. Contact</h2>
      <p>
        {LEGAL_ENTITY}, {REGISTERED_ADDRESS}
        <br />
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
