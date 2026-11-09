import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, Info } from 'lucide-react';
import PageShell from '@/components/shell/PageShell';
import { createPageUrl } from '../utils';

const LAST_UPDATED = 'December 22, 2025';

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    body: (
      <p>
        By accessing and using Easy Poultry marketplace, you accept and agree to be bound by the terms and
        provisions of this agreement. If you do not agree to these terms, please do not use our services.
      </p>
    ),
  },
  {
    id: 'use-of-platform',
    title: 'Use of the Platform',
    body: (
      <>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information when creating an account</li>
          <li>Maintain the security of your account credentials</li>
          <li>Use the platform only for lawful purposes</li>
          <li>Not engage in fraudulent, misleading, or deceptive practices</li>
          <li>Respect the intellectual property rights of others</li>
          <li>Not transmit viruses, malware, or any harmful code</li>
        </ul>
      </>
    ),
  },
  {
    id: 'seller-responsibilities',
    title: 'Seller Responsibilities',
    body: (
      <>
        <p>As a seller, you agree to:</p>
        <ul>
          <li>Provide accurate descriptions and images of products</li>
          <li>Fulfill orders and inquiries in a timely manner</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Maintain proper documentation for livestock and poultry sales</li>
          <li>Handle transactions professionally and ethically</li>
          <li>Respond to buyer inquiries within a reasonable timeframe</li>
        </ul>
      </>
    ),
  },
  {
    id: 'buyer-responsibilities',
    title: 'Buyer Responsibilities',
    body: (
      <>
        <p>As a buyer, you agree to:</p>
        <ul>
          <li>Communicate clearly and respectfully with sellers</li>
          <li>Conduct due diligence before making purchases</li>
          <li>Complete transactions in good faith</li>
          <li>Report any issues or disputes through appropriate channels</li>
        </ul>
      </>
    ),
  },
  {
    id: 'prohibited-activities',
    title: 'Prohibited Activities',
    body: (
      <>
        <p>The following activities are strictly prohibited:</p>
        <ul>
          <li>Listing illegal, stolen, or counterfeit items</li>
          <li>Engaging in price manipulation or anti-competitive behavior</li>
          <li>Harassing, threatening, or abusing other users</li>
          <li>Creating multiple accounts to circumvent restrictions</li>
          <li>Scraping or automated data collection</li>
          <li>Impersonating other users or entities</li>
        </ul>
      </>
    ),
  },
  {
    id: 'transactions',
    title: 'Transactions and Payments',
    body: (
      <p>
        Easy Poultry facilitates connections between buyers and sellers but is not directly involved in
        transactions. Payment terms and arrangements are agreed upon between buyers and sellers. We recommend
        using secure payment methods and meeting in safe, public locations when possible.
      </p>
    ),
  },
  {
    id: 'fees',
    title: 'Fees and Subscriptions',
    body: (
      <p>
        Certain features and services may require payment of fees. Subscription fees are non-refundable except
        as required by law. We reserve the right to modify pricing with reasonable notice to existing subscribers.
      </p>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    body: (
      <p>
        All content on the Easy Poultry platform, including text, graphics, logos, and software, is the property
        of Easy Poultry or its licensors. Users retain ownership of content they post but grant us a license to
        use, display, and distribute such content on the platform.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <p>
        The platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy,
        completeness, or reliability of listings. Users are responsible for verifying information and conducting
        their own due diligence before transactions.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    body: (
      <p>
        Easy Poultry shall not be liable for any indirect, incidental, special, consequential, or punitive
        damages resulting from your use of the platform. Our total liability shall not exceed the amount you
        paid us in the past 12 months.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <p>
        We reserve the right to suspend or terminate your account at any time for violation of these terms or
        for any other reason at our discretion. You may terminate your account at any time by contacting support.
      </p>
    ),
  },
  {
    id: 'disputes',
    title: 'Dispute Resolution',
    body: (
      <p>
        Any disputes arising from these terms or use of the platform shall be resolved through binding arbitration
        in accordance with applicable laws. Users waive the right to participate in class action lawsuits.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    body: (
      <p>
        We may update these terms from time to time. Continued use of the platform after changes constitutes
        acceptance of the revised terms. We will notify users of significant changes.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    body: (
      <p>
        These terms are governed by and construed in accordance with the laws of South Africa, without regard
        to conflict of law provisions.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Information',
    body: (
      <p>
        For questions about these terms, please contact us through the platform's support channels.
      </p>
    ),
  },
];

export default function TermsOfService() {
  return (
    <PageShell
      eyebrow="Legal"
      title={<>Terms of <span className="italic text-moss-700">service</span>.</>}
      subtitle={`The rules of the marketplace for buyers and sellers. Last updated ${LAST_UPDATED}.`}
      breadcrumb={[{ label: 'Home', href: createPageUrl('Home') }, { label: 'Terms of service' }]}
      action={
        <Link to={createPageUrl('PrivacyPolicy')} className="btn-ghost border border-border bg-white px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Privacy policy <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:items-start">
        {/* Table of contents rail */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <div className="card-premium p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <p className="eyebrow mb-3">On this page</p>
            <ol className="space-y-1">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink/65 hover:bg-moss-50 hover:text-moss-700 transition-colors">
                    <span className="text-[11px] font-semibold text-ink/35 tabular-nums mt-0.5 w-4">{String(i + 1).padStart(2, '0')}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        {/* Prose */}
        <article className="card-premium p-6 sm:p-10">
          {/* Mobile TOC */}
          <details className="lg:hidden mb-8 rounded-xl border border-border bg-cream p-4">
            <summary className="cursor-pointer text-sm font-medium text-ink">On this page</summary>
            <ol className="mt-3 space-y-1.5">
              {SECTIONS.map((s, i) => (
                <li key={s.id}><a href={`#${s.id}`} className="text-sm text-ink/65 hover:text-moss-700">{i + 1}. {s.title}</a></li>
              ))}
            </ol>
          </details>

          <div className="space-y-10">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-display text-sm font-semibold text-moss-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="font-display text-2xl text-ink">{s.title}</h2>
                </div>
                <div className="legal-prose text-ink/75 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-ink [&_strong]:font-semibold">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 p-5 bg-moss-50 border border-moss-100 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-moss-700 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink/75 leading-relaxed">
              <strong className="text-ink">Note:</strong> This is a template terms of service. Platform operators should consult with
              legal counsel to ensure these terms comply with all applicable laws and regulations.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-ink/55">
            <span>Last updated {LAST_UPDATED}</span>
            <Link to={createPageUrl('PrivacyPolicy')} className="inline-flex items-center gap-1 text-moss-700 hover:underline">Read our Privacy Policy <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
        </article>
      </div>
    </PageShell>
  );
}
