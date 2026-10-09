import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";
import { LEGAL_ENTITY } from "@/lib/legalConfig";

export const metadata: Metadata = {
  title: "Cookie Policy – Invonix",
  description:
    "Every cookie and browser storage key Invonix sets, what it is for, and how long it lasts.",
};

const cookies = [
  {
    name: "token",
    type: "Cookie (httpOnly, Secure, SameSite=None)",
    purpose:
      "Keeps you signed in to the customer portal. This is your session — the service cannot work without it.",
    duration:
      "The session length configured for your workspace, or 30 days if you tick “Remember me”. Cleared on sign out.",
    category: "Strictly necessary",
  },
  {
    name: "admin_token",
    type: "Cookie (httpOnly, Secure, SameSite=None)",
    purpose: "Keeps an administrator signed in to the Invonix admin panel. Not set for customer accounts.",
    duration: "The configured admin session length. Cleared on sign out.",
    category: "Strictly necessary",
  },
  {
    name: "selectedCompanyId",
    type: "Cookie (httpOnly, Secure, SameSite=None)",
    purpose:
      "Remembers which of your companies is selected, so documents and reports stay scoped to it between visits.",
    duration: "30 days, or until you switch back to “All companies”.",
    category: "Strictly necessary",
  },
  {
    name: "docuai_auth_token",
    type: "Browser local storage",
    purpose:
      "A copy of your session token, used only as a fallback when your browser blocks third-party cookies (Safari and private browsing modes). Without it those browsers would sign you out on every request.",
    duration: "Until you sign out or clear site data.",
    category: "Strictly necessary",
  },
  {
    name: "docuai.financialPeriod.v2, docuai.financialPeriod.custom",
    type: "Browser local storage",
    purpose:
      "Remembers the date period you last chose on the Financial dashboard so you do not reselect it each visit.",
    duration: "Until you clear site data.",
    category: "Functional",
  },
  {
    name: "docuai.uploadBatches",
    type: "Browser local storage",
    purpose:
      "Keeps the labels of your recent upload batches so they stay readable in the documents list.",
    duration: "Until you clear site data.",
    category: "Functional",
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro={`${LEGAL_ENTITY} sets only the cookies and browser-storage keys needed to sign you in and remember your preferences. We run no advertising, analytics or tracking cookies, and there is nothing here to opt out of beyond clearing site data.`}
    >
      <h2>1. What we set</h2>
      <p>
        The table below is the complete list. &quot;Strictly necessary&quot;
        items cannot be switched off without breaking sign-in;
        &quot;Functional&quot; items only remember a preference and the app
        works without them.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Purpose</th>
              <th>Duration</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie) => (
              <tr key={cookie.name}>
                <td>
                  <strong>{cookie.name}</strong>
                </td>
                <td>{cookie.type}</td>
                <td>{cookie.purpose}</td>
                <td>{cookie.duration}</td>
                <td>{cookie.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>2. What we do not set</h2>
      <ul>
        <li>No advertising or retargeting cookies.</li>
        <li>No cross-site tracking or fingerprinting.</li>
        <li>No third-party analytics cookies.</li>
        <li>No social media pixels.</li>
      </ul>
      <p>
        Because we set no cookies that require consent under the UAE PDPL or the
        EU ePrivacy rules, Invonix shows no cookie banner. If that ever changes
        we will add a consent control and update this page first.
      </p>

      <h2>3. Third-party pages</h2>
      <p>
        When you pay, checkout is handled by Stripe on Stripe&apos;s own
        infrastructure, and Stripe sets its own cookies for fraud prevention
        under its own policy. We do not control those cookies. See the{" "}
        <a
          href="https://stripe.com/legal/cookies-policy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe Cookie Policy
        </a>
        .
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        Every browser lets you view and delete cookies and site data, usually
        under Privacy settings. Deleting the items above signs you out and
        resets your saved filters; it does not delete any of your documents or
        extracted data. Blocking strictly necessary cookies prevents sign-in
        altogether.
      </p>

      <h2>5. Questions</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or read
        the <Link href="/privacy">Privacy Policy</Link> for how we handle
        personal data more generally.
      </p>
    </LegalPage>
  );
}
