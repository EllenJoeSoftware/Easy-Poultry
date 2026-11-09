import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowUpRight } from 'lucide-react';
import PageShell from '@/components/shell/PageShell';
import { createPageUrl } from '../utils';

const LAST_UPDATED = 'December 22, 2025';

const SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    body: (
      <p>
        Welcome to Easy Poultry. We respect your privacy and are committed to protecting your personal data.
        This privacy policy will inform you about how we look after your personal data when you visit our
        marketplace and tell you about your privacy rights.
      </p>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    body: (
      <>
        <p>We collect and process the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, phone number, profile photo, and location</li>
          <li><strong>Listing Information:</strong> Product details, descriptions, images, and pricing you post</li>
          <li><strong>Transaction Data:</strong> Payment information, inquiry details, and communication between buyers and sellers</li>
          <li><strong>Usage Data:</strong> How you interact with our platform, including page views and clicks</li>
          <li><strong>Device Information:</strong> IP address, browser type, and device identifiers</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    body: (
      <>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain our marketplace services</li>
          <li>Process transactions and send notifications about your account</li>
          <li>Improve and personalize your experience</li>
          <li>Communicate with you about products, services, and promotions</li>
          <li>Detect and prevent fraud and abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    id: 'information-sharing',
    title: 'Information Sharing',
    body: (
      <>
        <p>We share your information in the following circumstances:</p>
        <ul>
          <li><strong>With Other Users:</strong> Your public profile and listings are visible to all users</li>
          <li><strong>With Sellers:</strong> When you make an inquiry, your contact information is shared with the seller</li>
          <li><strong>Service Providers:</strong> We use trusted third-party services for hosting, analytics, and payment processing</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to processing of your data</li>
          <li>Export your data</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    body: (
      <p>
        We implement appropriate technical and organizational measures to protect your personal data against
        unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over
        the internet is 100% secure.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our
        marketing efforts. You can control cookies through your browser settings.
      </p>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    body: (
      <p>
        Our services are not directed to individuals under the age of 18. We do not knowingly collect personal
        information from children.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: (
      <p>
        We may update this privacy policy from time to time. We will notify you of any changes by posting the
        new privacy policy on this page and updating the "Last updated" date.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        If you have any questions about this privacy policy or our privacy practices, please contact us through
        the platform's support channels.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <PageShell
      eyebrow="Legal"
      title={<>Privacy <span className="italic text-moss-700">policy</span>.</>}
      subtitle={`How we collect, use and protect your data. Last updated ${LAST_UPDATED}.`}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Privacy policy' }]}
      action={
        <Link to={createPageUrl('TermsOfService')} className="btn-ghost border border-border bg-white px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Terms of service <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:items-start">
        {/* Table of contents rail */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <div className="card-premium p-4">
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
          <div className="mt-4 relative overflow-hidden rounded-2xl bg-moss-gradient text-cream p-4">
            <div className="absolute inset-0 grain opacity-50" />
            <div className="relative flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-cream/80 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-cream/80">You can access, correct, export or delete your data at any time. See <a href="#your-rights" className="underline text-cream">Your rights</a>.</p>
            </div>
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

          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-ink/55">
            <span>Last updated {LAST_UPDATED}</span>
            <Link to={createPageUrl('TermsOfService')} className="inline-flex items-center gap-1 text-moss-700 hover:underline">Read our Terms of Service <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
        </article>
      </div>
    </PageShell>
  );
}
