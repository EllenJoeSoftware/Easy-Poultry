import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import StatCard from '@/components/shell/StatCard';
import EmptyState from '@/components/shell/EmptyState';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, Send, Eye, Trash2, Users, CheckCircle2, Edit, Copy, Loader2, Image, Calendar, Zap, Play, Pause, Search, X, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const STATUS_CHIP = {
  sent: 'bg-fresh-50 text-moss-700 border-fresh-200',
  draft: 'bg-cream-deep text-ink/60 border-border',
  scheduled: 'bg-moss-50 text-moss-700 border-moss-100',
  active: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  failed: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
};

const EMAIL_TEMPLATES = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to Easy Poultry!',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#174D35;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#E5A23C;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}</style></head>
<body><div class="container"><div class="header"><h1>🐔 Welcome to Easy Poultry!</h1></div><div class="content"><p>Dear {{name}},</p><p>Thank you for joining Easy Poultry, South Africa's premier poultry marketplace!</p><p>We're excited to have you on board. Whether you're buying or selling, we're here to help you connect with the poultry community.</p><a href="{{site_url}}" class="button">Explore Marketplace</a><p>Happy trading!<br>The Easy Poultry Team</p></div></div></body>
</html>`
  },
  {
    name: 'New Listing Alert',
    subject: 'Check out the latest poultry listings!',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#E5A23C;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#174D35;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}</style></head>
<body><div class="container"><div class="header"><h1>🔔 New Listings Available!</h1></div><div class="content"><p>Hi {{name}},</p><p>We've got fresh listings that might interest you!</p><p>Check out the latest poultry, eggs, and equipment available on Easy Poultry.</p><a href="{{site_url}}/Marketplace" class="button">View New Listings</a><p>Don't miss out on great deals!<br>The Easy Poultry Team</p></div></div></body>
</html>`
  },
  {
    name: 'Promotion/Sale',
    subject: 'Special Offer Inside! 🎉',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#E5A23C,#174D35);color:white;padding:40px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#E5A23C;color:white;padding:15px 40px;text-decoration:none;border-radius:5px;margin:20px 0;font-size:18px}</style></head>
<body><div class="container"><div class="header"><h1>🎉 Special Offer!</h1><p style="font-size:24px;margin:0">Limited Time Only</p></div><div class="content"><p>Dear {{name}},</p><p>We have an exclusive offer just for you!</p><p><strong>Your custom promotion message here...</strong></p><a href="{{site_url}}" class="button">Shop Now</a><p>Hurry, this offer won't last forever!<br>The Easy Poultry Team</p></div></div></body>
</html>`
  }
];

export default function EmailCampaignManager() {
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    html_content: '',
    recipient_type: 'all',
    custom_emails: [],
    send_type: 'manual',
    scheduled_date: '',
    trigger_type: '',
    trigger_active: false
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: () => api.entities.EmailCampaign.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-crm'],
    queryFn: () => api.entities.User.list()
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => api.entities.EmailCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Campaign created');
      resetForm();
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.EmailCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Campaign updated');
      resetForm();
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => api.entities.EmailCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Campaign deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      let recipients = [];
      
      if (campaign.recipient_type === 'all') {
        recipients = users.map(u => ({ email: u.email, name: u.full_name }));
      } else if (campaign.recipient_type === 'sellers') {
        recipients = users.filter(u => u.user_type === 'seller' || u.user_type === 'both').map(u => ({ email: u.email, name: u.full_name }));
      } else if (campaign.recipient_type === 'buyers') {
        recipients = users.filter(u => u.user_type === 'buyer').map(u => ({ email: u.email, name: u.full_name }));
      } else if (campaign.recipient_type === 'verified_sellers') {
        recipients = users.filter(u => u.seller_verified).map(u => ({ email: u.email, name: u.full_name }));
      } else if (campaign.recipient_type === 'custom') {
        recipients = (campaign.custom_emails || []).map(email => {
          const user = users.find(u => u.email === email);
          return { email, name: user?.full_name || email.split('@')[0] };
        });
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          const personalizedHtml = campaign.html_content
            .replace(/\{\{name\}\}/g, recipient.name || 'Valued Customer')
            .replace(/\{\{email\}\}/g, recipient.email)
            .replace(/\{\{site_url\}\}/g, window.location.origin);

          await api.integrations.Core.SendEmail({
            to: recipient.email,
            subject: campaign.subject,
            body: personalizedHtml
          });
          sentCount++;
        } catch (error) {
          failedCount++;
        }
      }

      await api.entities.EmailCampaign.update(campaign.id, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        total_recipients: recipients.length,
        sent_count: sentCount,
        failed_count: failedCount
      });

      return { sentCount, failedCount, total: recipients.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success(`Campaign sent! ${result.sentCount}/${result.total} emails delivered`);
    },
    onError: () => {
      toast.error('Failed to send campaign');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', subject: '', html_content: '', recipient_type: 'all', custom_emails: [], send_type: 'manual', scheduled_date: '', trigger_type: '', trigger_active: false });
    setEditingCampaign(null);
    setShowComposer(false);
    setSelectedUsers([]);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      // Insert image HTML at cursor or append
      const imgTag = `<img src="${file_url}" alt="Campaign image" style="max-width:100%;height:auto;margin:10px 0;" />`;
      setFormData(prev => ({
        ...prev,
        html_content: prev.html_content + '\n' + imgTag
      }));
      toast.success('Image uploaded and added');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      html_content: campaign.html_content,
      recipient_type: campaign.recipient_type,
      custom_emails: campaign.custom_emails || [],
      send_type: campaign.send_type || 'manual',
      scheduled_date: campaign.scheduled_date || '',
      trigger_type: campaign.trigger_type || '',
      trigger_active: campaign.trigger_active || false
    });
    setSelectedUsers(campaign.custom_emails || []);
    setShowComposer(true);
  };

  const handleDuplicate = (campaign) => {
    setFormData({
      name: `${campaign.name} (Copy)`,
      subject: campaign.subject,
      html_content: campaign.html_content,
      recipient_type: campaign.recipient_type,
      custom_emails: campaign.custom_emails || [],
      send_type: campaign.send_type || 'manual',
      scheduled_date: '',
      trigger_type: campaign.trigger_type || '',
      trigger_active: false
    });
    setShowComposer(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.html_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.send_type === 'scheduled' && !formData.scheduled_date) {
      toast.error('Please select a scheduled date');
      return;
    }

    if (formData.send_type === 'triggered' && !formData.trigger_type) {
      toast.error('Please select a trigger event');
      return;
    }

    const data = {
      ...formData,
      custom_emails: formData.recipient_type === 'custom' ? selectedUsers : []
    };

    let status = 'draft';
    if (formData.send_type === 'scheduled') {
      status = 'scheduled';
    } else if (formData.send_type === 'triggered' && formData.trigger_active) {
      status = 'active';
    }

    if (editingCampaign) {
      updateCampaignMutation.mutate({ id: editingCampaign.id, data: { ...data, status: editingCampaign.status === 'sent' ? 'draft' : status } });
    } else {
      createCampaignMutation.mutate({ ...data, status });
    }
  };

  const toggleTriggerMutation = useMutation({
    mutationFn: async (campaign) => {
      const newActive = !campaign.trigger_active;
      await api.entities.EmailCampaign.update(campaign.id, {
        trigger_active: newActive,
        status: newActive ? 'active' : 'draft'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Trigger status updated');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      html_content: template.html
    }));
  };

  const getRecipientCount = (type) => {
    if (type === 'all') return users.length;
    if (type === 'sellers') return users.filter(u => u.user_type === 'seller' || u.user_type === 'both').length;
    if (type === 'buyers') return users.filter(u => u.user_type === 'buyer').length;
    if (type === 'verified_sellers') return users.filter(u => u.seller_verified).length;
    if (type === 'custom') return selectedUsers.length;
    return 0;
  };

  const q = search.trim().toLowerCase();
  const visibleCampaigns = campaigns.filter(c =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (!q || c.name?.toLowerCase().includes(q) || c.subject?.toLowerCase().includes(q))
  );
  const statusCounts = campaigns.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const cols = 'md:grid-cols-[minmax(0,2fr)_130px_110px_130px_44px]';
  const tabCls = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Mail} label="Total campaigns" value={campaigns.length} tint="moss" />
            <StatCard icon={Send} label="Sent" value={campaigns.filter(c => c.status === 'sent').length} tint="sage" />
            <StatCard icon={Users} label="Total users" value={users.length.toLocaleString()} tint="yolk" />
            <StatCard icon={CheckCircle2} label="Emails delivered" value={campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0).toLocaleString()} tint="terracotta" />
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="card-premium p-3 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {['all', 'draft', 'scheduled', 'active', 'sent'].map(s => {
            const on = statusFilter === s;
            const n = s === 'all' ? campaigns.length : (statusCounts[s] || 0);
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap capitalize px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                {s} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…"
            className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center" aria-label="Clear"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
        </div>
        <Button onClick={() => setShowComposer(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5">
          <Plus className="w-4 h-4" /> New campaign
        </Button>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns yet" subtitle="Create your first email campaign to reach your users."
          action={<Button onClick={() => setShowComposer(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Create campaign</Button>} />
      ) : visibleCampaigns.length === 0 ? (
        <EmptyState icon={Mail} title="No campaigns match" subtitle="Try a different filter or search term." />
      ) : (
        <div className="card-premium overflow-hidden">
          <div className={`hidden md:grid ${cols} items-center gap-4 px-5 py-3 bg-cream border-b border-border text-[11px] uppercase tracking-wider font-semibold text-ink/50`}>
            <span>Campaign</span><span>Recipients</span><span>Status</span><span>Delivery</span><span />
          </div>
          <ul className="divide-y divide-border">
            {visibleCampaigns.map((campaign) => {
              const chip = STATUS_CHIP[campaign.status] || STATUS_CHIP.draft;
              return (
                <li key={campaign.id} className={`grid grid-cols-1 ${cols} gap-2 md:gap-4 md:items-center px-4 md:px-5 py-3.5 hover:bg-cream/70 transition-colors`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0">
                      {campaign.send_type === 'triggered' ? <Zap className="w-4 h-4" /> : campaign.send_type === 'scheduled' ? <Calendar className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{campaign.name}</p>
                      <p className="text-xs text-ink/55 truncate">{campaign.subject}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-ink/55">
                        {campaign.send_type === 'triggered' && <span className="inline-flex items-center gap-1 capitalize"><Zap className="w-3 h-3 text-yolk-500" />{campaign.trigger_type?.replace('_', ' ')}</span>}
                        {campaign.send_type === 'scheduled' && campaign.scheduled_date && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-moss-600" />{moment(campaign.scheduled_date).format('MMM D, h:mm A')}</span>}
                        <span className="md:hidden chip !py-0 !px-2 text-[10px] capitalize">{campaign.recipient_type?.replace('_', ' ')}</span>
                        <span className={`md:hidden capitalize inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${chip}`}>{campaign.status}</span>
                      </div>
                    </div>
                  </div>
                  <span className="hidden md:inline-flex chip text-[11px] capitalize w-fit">{campaign.recipient_type?.replace('_', ' ')}</span>
                  <span className={`hidden md:inline-flex capitalize items-center w-fit px-2.5 py-1 rounded-full border text-[11px] font-medium ${chip}`}>{campaign.status}</span>
                  <span className="hidden md:block text-sm text-ink/65 tabular-nums">
                    {campaign.status === 'sent' ? `${campaign.sent_count || 0} / ${campaign.total_recipients || 0} sent` : '—'}
                  </span>
                  <div className="flex items-center md:justify-end gap-1">
                    {campaign.send_type === 'triggered' ? (
                      <button onClick={() => toggleTriggerMutation.mutate(campaign)} disabled={toggleTriggerMutation.isPending}
                        title={campaign.trigger_active ? 'Deactivate trigger' : 'Activate trigger'}
                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border ${campaign.trigger_active ? 'bg-yolk-50 text-yolk-700 border-yolk-200' : 'bg-white text-moss-700 border-border hover:bg-moss-50'}`}>
                        {toggleTriggerMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : campaign.trigger_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{campaign.trigger_active ? 'Pause' : 'Activate'}</span>
                      </button>
                    ) : (
                      <button onClick={() => sendCampaignMutation.mutate(campaign)} disabled={sendCampaignMutation.isPending}
                        title={campaign.status === 'sent' ? 'Resend campaign' : 'Send campaign'}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium bg-moss-600 text-cream hover:bg-moss-700 disabled:opacity-60">
                        {sendCampaignMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{campaign.status === 'sent' ? 'Resend' : 'Send'}</span>
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Campaign actions"><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuItem onSelect={() => { setFormData(campaign); setShowPreview(true); }} className="gap-2"><Eye className="w-4 h-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleEdit(campaign)} className="gap-2"><Edit className="w-4 h-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDuplicate(campaign)} className="gap-2"><Copy className="w-4 h-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => deleteCampaignMutation.mutate(campaign.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 bg-cream border-t border-border text-xs text-ink/50">{visibleCampaigns.length} of {campaigns.length} campaigns</div>
        </div>
      )}

      {/* Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={() => resetForm()}>
        <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCampaign ? 'Edit campaign' : 'Create email campaign'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="compose" className="space-y-4">
            <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex flex-wrap">
              <TabsTrigger value="compose" className={tabCls}>Compose</TabsTrigger>
              <TabsTrigger value="templates" className={tabCls}>Templates</TabsTrigger>
              <TabsTrigger value="delivery" className={tabCls}>Delivery</TabsTrigger>
              <TabsTrigger value="recipients" className={tabCls}>Recipients ({getRecipientCount(formData.recipient_type)})</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Newsletter"
                />
              </div>
              <div>
                <Label>Subject Line *</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Check out our latest listings!"
                />
              </div>
              <div>
                <Label>HTML Content *</Label>
                <Textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  placeholder="Paste your HTML email content here..."
                  rows={12}
                  className="mt-1.5 rounded-xl font-mono text-sm"
                />
                <p className="text-xs text-ink/55 mt-1">
                  Use {'{{name}}'}, {'{{email}}'}, {'{{site_url}}'} for personalization
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full gap-1.5" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4" /> Preview
                </Button>
                <div className="relative">
                  <Button variant="outline" className="rounded-full gap-1.5" disabled={uploadingImage} onClick={() => document.getElementById('campaign-image-upload').click()}>
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Add image
                  </Button>
                  <input
                    id="campaign-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <p className="text-sm text-ink/65">Select a template to start with:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EMAIL_TEMPLATES.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="text-left rounded-xl border border-border bg-cream p-4 hover:border-moss-400 hover:bg-moss-50/50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center mb-3"><Mail className="w-4 h-4 text-moss-600" /></div>
                    <h4 className="font-semibold text-ink">{template.name}</h4>
                    <p className="text-xs text-ink/60 mt-0.5">{template.subject}</p>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <div>
                <Label>Send Type</Label>
                <Select value={formData.send_type} onValueChange={(value) => setFormData({ ...formData, send_type: value })}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual - Send when ready</SelectItem>
                    <SelectItem value="scheduled">Scheduled - Send at specific time</SelectItem>
                    <SelectItem value="triggered">Triggered - Send on system events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.send_type === 'scheduled' && (
                <div>
                  <Label>Scheduled Date & Time</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="datetime-local"
                    value={formData.scheduled_date ? formData.scheduled_date.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: new Date(e.target.value).toISOString() })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-ink/55 mt-1">Campaign will be sent automatically at this time</p>
                </div>
              )}

              {formData.send_type === 'triggered' && (
                <div className="space-y-4">
                  <div>
                    <Label>Trigger Event</Label>
                    <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                      <SelectTrigger className="mt-1.5 rounded-xl">
                        <SelectValue placeholder="Select trigger event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_user">New User Registration</SelectItem>
                        <SelectItem value="new_listing">New Listing Posted</SelectItem>
                        <SelectItem value="new_seller">New Seller Account Created</SelectItem>
                        <SelectItem value="seller_verified">Seller Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-moss-50 border border-moss-100 rounded-xl">
                    <p className="text-sm text-moss-800">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {formData.trigger_type === 'new_user' && 'Email will be sent to each new user when they register'}
                      {formData.trigger_type === 'new_listing' && 'Email will be sent to all subscribers when a new listing is posted'}
                      {formData.trigger_type === 'new_seller' && 'Email will be sent when a new seller account is created'}
                      {formData.trigger_type === 'seller_verified' && 'Email will be sent to the seller when their account is verified'}
                      {!formData.trigger_type && 'Select a trigger event to see details'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 rounded-xl bg-cream border border-border px-3 py-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      id="trigger_active"
                      checked={formData.trigger_active}
                      onChange={(e) => setFormData({ ...formData, trigger_active: e.target.checked })}
                      className="w-4 h-4 accent-moss-600"
                    />
                    Activate trigger immediately after saving
                  </label>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <div>
                <Label>Recipient Group</Label>
                <Select value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({users.length})</SelectItem>
                    <SelectItem value="sellers">Sellers Only ({users.filter(u => u.user_type === 'seller' || u.user_type === 'both').length})</SelectItem>
                    <SelectItem value="buyers">Buyers Only ({users.filter(u => u.user_type === 'buyer').length})</SelectItem>
                    <SelectItem value="verified_sellers">Verified Sellers ({users.filter(u => u.seller_verified).length})</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipient_type === 'custom' && (
                <div className="border border-border bg-cream rounded-xl p-3 max-h-64 overflow-y-auto">
                  <p className="text-xs uppercase tracking-wider font-semibold text-ink/45 mb-2 px-2">Select recipients</p>
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 py-1.5 hover:bg-white px-2 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.email]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(email => email !== user.email));
                          }
                        }}
                        className="w-4 h-4 accent-moss-600"
                      />
                      <span className="text-sm text-ink">{user.full_name || user.email}</span>
                      <span className="text-xs text-ink/50 truncate">({user.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} className="btn-cta px-5">
              {editingCampaign ? 'Update campaign' : 'Save as draft'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display">Email preview</DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-cream p-3 border-b border-border">
              <p className="text-sm text-ink"><span className="text-ink/55">Subject:</span> <strong>{formData.subject}</strong></p>
            </div>
            <iframe
              srcDoc={formData.html_content
                ?.replace(/\{\{name\}\}/g, 'John Doe')
                .replace(/\{\{email\}\}/g, 'john@example.com')
                .replace(/\{\{site_url\}\}/g, window.location.origin)}
              className="w-full h-[500px] bg-white"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
