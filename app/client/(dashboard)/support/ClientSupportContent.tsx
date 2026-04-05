'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/client/auth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MessageSquare, Plus, Search, Loader2, AlertCircle, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/utils';

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
}

import { useRouter, useSearchParams } from 'next/navigation';

export default function ClientSupportContent() {
  const { email, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Create Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Pre-fill from URL if provided (e.g. from order history)
  useEffect(() => {
      const urlSubject = searchParams?.get('subject');
      const urlReason = searchParams?.get('reason');
      
      if (urlSubject) {
          setSubject(urlSubject);
          setShowCreateModal(true);
      }
      if (urlReason === 'premium') setCategory('payment');
  }, [searchParams]);

  useEffect(() => {
     if (isAuthenticated && email) {
         fetchTickets();
     } else if (!isAuthenticated && !loading) {
         // Should be handled by layout/middleware, but safe check
     }
  }, [isAuthenticated, email]);

  const fetchTickets = async () => {
      try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/api/tickets?email=${email}`);
          const data = await res.json();
          if (data.success) {
              setTickets(data.tickets);
          }
      } catch (error) {
          console.error('Error fetching tickets:', error);
      } finally {
          setLoading(false);
      }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      
      try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/api/tickets`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email,
                  subject,
                  category,
                  message
              })
          });
          
          const data = await res.json();
          if (data.success) {
              setShowCreateModal(false);
              setSubject('');
              setMessage('');
              fetchTickets(); // Refresh list
              router?.push(`/client/support/${data.ticket.ticketNumber}`); // Go to new ticket
          } else {
              alert(data.error || 'Failed to create ticket');
          }
      } catch (error) {
           console.error('Create error:', error);
           alert('An error occurred');
      } finally {
          setCreating(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
          case 'open': return 'accent-text accent-bg accent-border';
          case 'closed': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
          case 'replied': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
          default: return 'text-gray-400 bg-gray-500/10';
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    Support Tickets
                    {tickets.filter(t => t.status === 'replied').length > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-500 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                            {tickets.filter(t => t.status === 'replied').length} New Action Required
                        </span>
                    )}
                </h1>
                <p className="text-gray-500 text-sm">Manage your support tickets and get help from our team</p>
            </div>
             <Button 
                onClick={() => setShowCreateModal(true)}
                className="accent-bg accent-text font-semibold border-none rounded-lg px-6 hover:opacity-90 transition-opacity"
            >
                <Plus className="w-4 h-4 mr-2" />
                Create ticket
            </Button>
        </div>

        {/* Tickets List */}
        <Card className="p-0 overflow-hidden flex flex-col bg-[#0f0f0f] border-[#1f1f1f]">
            {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8">
                     <Loader2 className="w-6 h-6 animate-spin accent-text mb-4" />
                 </div>
            ) : tickets.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                    <div className="mb-3 opacity-20">
                         <MessageSquare className="w-12 h-12" />
                    </div>
                    <h3 className="text-white font-medium mb-1">No support tickets</h3>
                    <p className="mb-4 text-sm text-gray-600">You haven't created any support tickets yet.</p>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="accent-bg accent-text font-semibold border-none rounded-lg px-4 py-2 text-sm hover:opacity-90 transition-opacity"
                    >
                         <Plus className="w-3 h-3 mr-2" />
                        Create ticket
                    </Button>
                </div>
            ) : (
                <div className="divide-y divide-[#2a2a2a]">
                    {tickets.map(ticket => (
                        <Link 
                            key={ticket.id} 
                            href={`/client/support/${ticket.ticket_number}`}
                            className="block p-4 hover:bg-[#1f1f1f] transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(ticket.status)} capitalize`}>
                                            {ticket.status}
                                        </span>
                                        <h3 className="text-white font-medium">{ticket.subject}</h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="font-mono">#{ticket.ticket_number}</span>
                                        <span>•</span>
                                        <span className="capitalize">{ticket.category}</span>
                                        <span>•</span>
                                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            
            {/* Pagination Placeholder - Hide if empty */}
            {!loading && tickets.length > 0 && (
                <div className="p-4 border-t border-[#2a2a2a] flex justify-between items-center text-xs text-gray-500 bg-[#141414]">
                    <span>Showing {tickets.length} of {tickets.length}</span>
                    <div className="flex gap-2">
                        <button disabled className="px-2 py-1 rounded bg-[#1f1f1f] disabled:opacity-50">&lt;</button>
                        <span className="px-2 py-1">1 of 1</span>
                        <button disabled className="px-2 py-1 rounded bg-[#1f1f1f] disabled:opacity-50">&gt;</button>
                         <select className="bg-[#1f1f1f] border-none rounded px-2 py-1 text-xs">
                            <option>10</option>
                        </select>
                    </div>
                </div>
            )}
        </Card>

        {/* Create Ticket Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
                <Card className="w-full max-w-lg p-6 relative">
                    <h2 className="text-xl font-bold text-white mb-6">Create New Ticket</h2>
                    
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                            <input 
                                type="text"
                                required 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief summary of the issue..."
                                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                            >
                                <option value="general">General Inquiry</option>
                                <option value="payment">Payment Issue</option>
                                <option value="technical">Technical Support</option>
                                <option value="bug">Report a Bug</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                            <textarea 
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue in detail..."
                                rows={5}
                                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                             <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={creating}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create Ticket'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
    </div>
  );
}
