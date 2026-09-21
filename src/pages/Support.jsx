import React, { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, ChevronDown, Send, Phone, BookOpen, Shield, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell, { Section } from '@/components/shell/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '../utils';

const FAQ = [
  { q: 'How do I create a shop?',
    a: 'Sign up, then go to Profile → Seller Info. Add your business name, banner, logo and bio. Your shop URL is live the moment you save.' },
  { q: 'Is Easy Poultry free to use?',
    a: 'Yes — free to sign up, free to list, free to message. We only take a small 5% platform fee on completed sales, deducted before you request a payout.' },
  { q: 'How do I get paid?',
    a: 'Payments go through Yoco. Your earnings show up in Farm → Payouts. Click "Request payout" once you have R50 or more available, and we transfer it to your bank within 2 business days.' },
  { q: 'How do I sell digital products like guides or eBooks?',
    a: 'When creating a listing, pick "Digital product" at the top. Upload your PDFs / files (max 20 files, 50 MB each). Buyers pay through Yoco and get instant download access.' },
  { q: 'Can I add team members to my farm?',
    a: 'Yes — go to Farm → Team, invite by email, and assign a role (Admin, Manager, Worker or Viewer). Each member signs in with their own email.' },
  { q: 'How do live auctions work?',
    a: 'Every Tuesday from 19:00 SAST, listed items go live for bidding. Buyers place bids in real-time; the highest bid at end wins. Sellers pay a small auction fee only on completed sales.' },
  { q: 'What if I have a dispute with a buyer or seller?',
    a: 'Contact us via the form below or WhatsApp. We mediate disputes on auctions over R5,000 with escrowed payment. For direct sales, we help facilitate resolution.' },
  { q: 'How do I delete my account?',
    a: 'Email us at support@easypoultry.co.za with your registered email and we will permanently remove your account, listings, and personal data within 7 days.' },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) return toast.error('Fill in name, email and message');
    setSending(true);
    try {
      await api.entities.SupportRequest.create({
        name, email, subject: subject || 'Support request', message, status: 'open',
      });
      setSent(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      console.error('[support]', err);
      toast.error('Could not send — email support@easypoultry.co.za directly.');
    } finally { setSending(false); }
  };

  return (
    <PageShell
      eyebrow="Support"
      title="How can we help?"
      subtitle="Find answers in the FAQ, or send us a message — we usually reply within a few hours during business days."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Support' }]}
    >
      {/* Quick contact tiles */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <a href="mailto:support@easypoultry.co.za" className="card-premium p-6 hover:-translate-y-1 transition-transform">
          <div className="w-11 h-11 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-4"><Mail className="w-5 h-5" /></div>
          <p className="font-display text-lg text-ink">Email us</p>
          <p className="text-sm text-ink/60 mt-1">support@easypoultry.co.za</p>
          <p className="text-xs text-ink/45 mt-2">Reply within 24h · Mon–Fri</p>
        </a>
        <a href="https://wa.me/27797871677?text=Hi%2C%20I%20need%20help%20with%20Easy%20Poultry" target="_blank" rel="noopener noreferrer" className="card-premium p-6 hover:-translate-y-1 transition-transform">
          <div className="w-11 h-11 rounded-xl bg-terracotta-50 border border-terracotta-100 flex items-center justify-center text-terracotta-600 mb-4"><MessageCircle className="w-5 h-5" /></div>
          <p className="font-display text-lg text-ink">WhatsApp</p>
          <p className="text-sm text-ink/60 mt-1">Chat with our team</p>
          <p className="text-xs text-ink/45 mt-2">Fastest · 8am–6pm SAST</p>
        </a>
        <a href="tel:+27797871677" className="card-premium p-6 hover:-translate-y-1 transition-transform">
          <div className="w-11 h-11 rounded-xl bg-yolk-50 border border-yolk-100 flex items-center justify-center text-yolk-600 mb-4"><Phone className="w-5 h-5" /></div>
          <p className="font-display text-lg text-ink">Call us</p>
          <p className="text-sm text-ink/60 mt-1">+27 79 787 1677</p>
          <p className="text-xs text-ink/45 mt-2">Mon–Fri · 9am–5pm SAST</p>
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* FAQ */}
        <Section eyebrow="Common questions" title="FAQ" className="lg:col-span-2">
          <div className="card-premium overflow-hidden divide-y divide-border">
            {FAQ.map((item, i) => {
              const open = openIdx === i;
              return (
                <div key={i}>
                  <button onClick={() => setOpenIdx(open ? -1 : i)} className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-cream-deep/40 transition-colors">
                    <span className="font-medium text-ink">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 text-ink/50 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-ink/70 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Contact form */}
        <div>
          <p className="eyebrow mb-2">Still stuck?</p>
          <h2 className="font-display text-2xl text-ink mb-4">Send a message</h2>
          {sent ? (
            <div className="card-premium p-6 text-center bg-moss-50 border-moss-100">
              <CheckCircle2 className="w-10 h-10 text-moss-600 mx-auto mb-3" />
              <p className="font-display text-lg text-ink mb-1">Message received</p>
              <p className="text-sm text-ink/65">We'll reply to you within 24 hours.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-xs text-moss-700 hover:underline">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="card-premium p-6 space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="Your full name" required /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" required /></div>
              <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" placeholder="What's this about?" /></div>
              <div><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" rows={5} placeholder="Tell us what's going on…" required /></div>
              <Button type="submit" disabled={sending} className="btn-cta w-full py-2.5 text-sm gap-1.5">
                {sending ? 'Sending…' : (<><Send className="w-4 h-4" />Send message</>)}
              </Button>
            </form>
          )}

          <div className="mt-6 space-y-2">
            <a href={createPageUrl('PrivacyPolicy')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-deep transition-colors text-sm text-ink/70">
              <Shield className="w-4 h-4 text-moss-600" />Privacy policy
            </a>
            <a href={createPageUrl('TermsOfService')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-deep transition-colors text-sm text-ink/70">
              <BookOpen className="w-4 h-4 text-moss-600" />Terms of service
            </a>
            <a href={createPageUrl('AppMarketing')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-deep transition-colors text-sm text-ink/70">
              <HelpCircle className="w-4 h-4 text-moss-600" />Get the mobile app
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
