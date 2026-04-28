import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Plus, Send, Eye, Trash2, Users, Clock, CheckCircle2, XCircle, Edit, Copy, Loader2, Image, Upload, Calendar, Zap, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

const EMAIL_TEMPLATES = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to Easy Poultry!',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#7A9D7A;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#E07A5F;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}</style></head>
<body><div class="container"><div class="header"><h1>🐔 Welcome to Easy Poultry!</h1></div><div class="content"><p>Dear {{name}},</p><p>Thank you for joining Easy Poultry, South Africa's premier poultry marketplace!</p><p>We're excited to have you on board. Whether you're buying or selling, we're here to help you connect with the poultry community.</p><a href="{{site_url}}" class="button">Explore Marketplace</a><p>Happy trading!<br>The Easy Poultry Team</p></div></div></body>
</html>`
  },
  {
    name: 'New Listing Alert',
    subject: 'Check out the latest poultry listings!',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#E07A5F;color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#7A9D7A;color:white;padding:12px 30px;text-decoration:none;border-radius:5px;margin:20px 0}</style></head>
<body><div class="container"><div class="header"><h1>🔔 New Listings Available!</h1></div><div class="content"><p>Hi {{name}},</p><p>We've got fresh listings that might interest you!</p><p>Check out the latest poultry, eggs, and equipment available on Easy Poultry.</p><a href="{{site_url}}/Marketplace" class="button">View New Listings</a><p>Don't miss out on great deals!<br>The Easy Poultry Team</p></div></div></body>
</html>`
  },
  {
    name: 'Promotion/Sale',
    subject: 'Special Offer Inside! 🎉',
    html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#E07A5F,#7A9D7A);color:white;padding:40px;text-align:center;border-radius:10px 10px 0 0}.content{background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px}.button{display:inline-block;background:#E07A5F;color:white;padding:15px 40px;text-decoration:none;border-radius:5px;margin:20px 0;font-size:18px}</style></head>
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
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.EmailCampaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Campaign updated');
      resetForm();
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => api.entities.EmailCampaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email-campaigns']);
      toast.success('Campaign deleted');
    }
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
    }
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow">
          <Mail className="w-6 h-6 text-[#7A9D7A] mb-2" />
          <p className="text-2xl font-bold">{campaigns.length}</p>
          <p className="text-sm text-gray-600">Total Campaigns</p>
        </Card>
        <Card className="p-4 border-0 shadow">
          <Send className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'sent').length}</p>
          <p className="text-sm text-gray-600">Sent</p>
        </Card>
        <Card className="p-4 border-0 shadow">
          <Users className="w-6 h-6 text-[#E07A5F] mb-2" />
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </Card>
        <Card className="p-4 border-0 shadow">
          <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}</p>
          <p className="text-sm text-gray-600">Emails Delivered</p>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Campaigns</h3>
        <Button onClick={() => setShowComposer(true)} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns List */}
      <Card className="border-0 shadow overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
            <p className="text-gray-600">Create your first email campaign</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden divide-y">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="capitalize text-xs">{campaign.recipient_type}</Badge>
                        <Badge className={`text-xs ${
                          campaign.status === 'sent' ? 'bg-green-500' :
                          campaign.status === 'draft' ? 'bg-gray-500' :
                          campaign.status === 'scheduled' ? 'bg-blue-500' :
                          campaign.status === 'active' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => { setFormData(campaign); setShowPreview(true); }}>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {campaign.send_type === 'triggered' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={campaign.trigger_active ? 'text-yellow-600' : 'text-green-600'}
                        onClick={() => toggleTriggerMutation.mutate(campaign)}
                        disabled={toggleTriggerMutation.isPending}
                      >
                        {toggleTriggerMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : 
                          campaign.trigger_active ? <><Pause className="w-4 h-4 mr-1" />Deactivate</> : <><Play className="w-4 h-4 mr-1" />Activate</>}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => sendCampaignMutation.mutate(campaign)}
                        disabled={sendCampaignMutation.isPending}
                      >
                        {sendCampaignMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                        {campaign.status === 'sent' ? 'Resend' : 'Send Now'}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(campaign)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteCampaignMutation.mutate(campaign.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                      {campaign.send_type === 'triggered' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500 capitalize">{campaign.trigger_type?.replace('_', ' ')}</span>
                        </div>
                      )}
                      {campaign.send_type === 'scheduled' && campaign.scheduled_date && (
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-gray-500">{moment(campaign.scheduled_date).format('MMM D, h:mm A')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">{campaign.recipient_type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        campaign.status === 'sent' ? 'bg-green-500' :
                        campaign.status === 'draft' ? 'bg-gray-500' :
                        campaign.status === 'scheduled' ? 'bg-blue-500' :
                        campaign.status === 'active' ? 'bg-yellow-500' : 'bg-red-500'
                      }>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {campaign.status === 'sent' ? (
                        <span>{campaign.sent_count || 0} / {campaign.total_recipients || 0} sent</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setFormData(campaign); setShowPreview(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {campaign.send_type === 'triggered' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={campaign.trigger_active ? 'text-yellow-600' : 'text-green-600'}
                            onClick={() => toggleTriggerMutation.mutate(campaign)}
                            disabled={toggleTriggerMutation.isPending}
                            title={campaign.trigger_active ? 'Deactivate trigger' : 'Activate trigger'}
                          >
                            {toggleTriggerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                              campaign.trigger_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => sendCampaignMutation.mutate(campaign)}
                            disabled={sendCampaignMutation.isPending}
                            title={campaign.status === 'sent' ? 'Resend campaign' : 'Send campaign'}
                          >
                            {sendCampaignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(campaign)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteCampaignMutation.mutate(campaign.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {/* Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Email Campaign'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="compose" className="space-y-4">
            <TabsList>
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
              <TabsTrigger value="recipients">Recipients ({getRecipientCount(formData.recipient_type)})</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Newsletter"
                />
              </div>
              <div>
                <Label>Subject Line *</Label>
                <Input
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
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{name}}'}, {'{{email}}'}, {'{{site_url}}'} for personalization
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <div className="relative">
                  <Button variant="outline" disabled={uploadingImage} onClick={() => document.getElementById('campaign-image-upload').click()}>
                    {uploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                    Add Image
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
              <p className="text-sm text-gray-600">Select a template to start with:</p>
              <div className="grid gap-4">
                {EMAIL_TEMPLATES.map((template, idx) => (
                  <Card
                    key={idx}
                    className="p-4 cursor-pointer hover:border-[#7A9D7A] transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.subject}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <div>
                <Label>Send Type</Label>
                <Select value={formData.send_type} onValueChange={(value) => setFormData({ ...formData, send_type: value })}>
                  <SelectTrigger>
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
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_date ? formData.scheduled_date.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: new Date(e.target.value).toISOString() })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Campaign will be sent automatically at this time</p>
                </div>
              )}

              {formData.send_type === 'triggered' && (
                <div className="space-y-4">
                  <div>
                    <Label>Trigger Event</Label>
                    <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                      <SelectTrigger>
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
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {formData.trigger_type === 'new_user' && 'Email will be sent to each new user when they register'}
                      {formData.trigger_type === 'new_listing' && 'Email will be sent to all subscribers when a new listing is posted'}
                      {formData.trigger_type === 'new_seller' && 'Email will be sent when a new seller account is created'}
                      {formData.trigger_type === 'seller_verified' && 'Email will be sent to the seller when their account is verified'}
                      {!formData.trigger_type && 'Select a trigger event to see details'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="trigger_active"
                      checked={formData.trigger_active}
                      onChange={(e) => setFormData({ ...formData, trigger_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="trigger_active">Activate trigger immediately after saving</Label>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <div>
                <Label>Recipient Group</Label>
                <Select value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}>
                  <SelectTrigger>
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
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">Select recipients:</p>
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded cursor-pointer">
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
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{user.full_name || user.email}</span>
                      <span className="text-xs text-gray-500">({user.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
              {editingCampaign ? 'Update Campaign' : 'Save as Draft'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 border-b">
              <p className="text-sm"><strong>Subject:</strong> {formData.subject}</p>
            </div>
            <iframe
              srcDoc={formData.html_content
                ?.replace(/\{\{name\}\}/g, 'John Doe')
                .replace(/\{\{email\}\}/g, 'john@example.com')
                .replace(/\{\{site_url\}\}/g, window.location.origin)}
              className="w-full h-[500px]"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}