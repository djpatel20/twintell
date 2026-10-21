'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api-client';
import { Inquiry, InquiryMessage } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { VerifiedBadge } from '../../components/ui/Badge';
import {
  MessageSquare,
  Send,
  Package,
  Building2,
  User as UserIcon,
  Search,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Clock,
  Sparkles,
  Power,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '../../context/NotificationContext';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryInquiryId = searchParams.get('inquiryId');

  const { user, company, isLoading: authLoading } = useAuth();
  const { markInquiryRead } = useNotifications();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(queryInquiryId);
  const [messageText, setMessageText] = useState('');
  const [isMobileThreadOpen, setIsMobileThreadOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCompany = user?.role === 'COMPANY';

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Sync selectedInquiryId from URL query param if present
  useEffect(() => {
    if (queryInquiryId) {
      setSelectedInquiryId(queryInquiryId);
      setIsMobileThreadOpen(true);
    }
  }, [queryInquiryId]);

  // 1. Fetch Inquiries List
  const {
    data: inquiriesData,
    isLoading: inquiriesLoading,
    refetch: refetchInquiries,
  } = useQuery({
    queryKey: ['inquiries-list', activeTab],
    queryFn: () =>
      api.get<{ data: Inquiry[] }>(
        `/api/inquiries?type=${activeTab}&limit=50`
      ),
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15s for new incoming messages
  });

  const inquiries = inquiriesData?.data || [];

  // Filter inquiries by search query
  const filteredInquiries = inquiries.filter((inq) => {
    const isSentByMe = inq.userId === user?.id;
    const name = isSentByMe ? inq.company?.name : inq.user?.name;
    const productTitle = inq.product?.title || '';
    const q = searchQuery.toLowerCase();
    return (
      (name && name.toLowerCase().includes(q)) ||
      productTitle.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q)
    );
  });

  // Auto-select first inquiry on desktop if none selected
  useEffect(() => {
    if (!selectedInquiryId && filteredInquiries.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSelectedInquiryId(filteredInquiries[0].id);
    }
  }, [filteredInquiries, selectedInquiryId]);

  // Mark inquiry as read & decrement unread count when viewing thread
  useEffect(() => {
    if (selectedInquiryId) {
      markInquiryRead(selectedInquiryId);
    }
  }, [selectedInquiryId, markInquiryRead]);

  // 2. Fetch Active Conversation Thread details
  const {
    data: activeInquiryData,
    isLoading: activeThreadLoading,
  } = useQuery({
    queryKey: ['inquiry-thread', selectedInquiryId],
    queryFn: () =>
      api.get<{ data: Inquiry }>(`/api/inquiries/${selectedInquiryId}`),
    enabled: !!selectedInquiryId,
    refetchInterval: 5000, // Active thread polls every 5s for live conversation updates
  });

  const activeInquiry = activeInquiryData?.data;

  // Auto-scroll messages to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (activeInquiry?.messages) {
      scrollToBottom('auto');
    }
  }, [activeInquiry?.messages?.length, selectedInquiryId]);

  // 3. Send Message Mutation with Optimistic Instant Update
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      api.post<{ data: InquiryMessage }>(`/api/inquiries/${selectedInquiryId}/messages`, {
        content,
      }),
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['inquiry-thread', selectedInquiryId] });

      const previousThread = queryClient.getQueryData<{ data: Inquiry }>(['inquiry-thread', selectedInquiryId]);

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: InquiryMessage = {
        id: tempId,
        inquiryId: selectedInquiryId!,
        senderId: user?.id || '',
        content,
        createdAt: new Date().toISOString(),
        status: 'pending',
        sender: {
          id: user?.id || '',
          name: user?.name || (isCompany ? company?.name : 'Me') || 'Me',
          avatarUrl: user?.avatarUrl || (isCompany ? company?.logoUrl : null) || null,
        },
      };

      if (previousThread) {
        queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', selectedInquiryId], {
          ...previousThread,
          data: {
            ...previousThread.data,
            messages: [...(previousThread.data.messages || []), optimisticMsg],
          },
        });
      }

      setMessageText('');
      setTimeout(() => scrollToBottom('smooth'), 50);

      return { previousThread, tempId };
    },
    onSuccess: (res, _content, context) => {
      queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', selectedInquiryId], (old) => {
        if (!old) return old;
        const messagesWithoutTemp = (old.data.messages || []).filter((m) => m.id !== context?.tempId);
        return {
          ...old,
          data: {
            ...old.data,
            messages: [...messagesWithoutTemp, { ...res.data, status: 'sent' }],
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['inquiries-list'] });
      setTimeout(() => scrollToBottom('smooth'), 50);
    },
    onError: (_err: any, _content, context) => {
      queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', selectedInquiryId], (old) => {
        if (!old) return context?.previousThread;
        return {
          ...old,
          data: {
            ...old.data,
            messages: (old.data.messages || []).map((m) =>
              m.id === context?.tempId ? { ...m, status: 'failed' as const } : m
            ),
          },
        };
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedInquiryId) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (authLoading) {
    return (
      <AppShell contentMaxWidth="full" showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="w-8 h-8 text-cobalt animate-spin" />
          <p className="text-xs text-slate-500">Loading your inbox...</p>
        </div>
      </AppShell>
    );
  }

  // Active inquiry counterparty identification
  const isSentByMe = activeInquiry?.userId === user?.id;
  const counterpartyName = isSentByMe
    ? activeInquiry?.company?.name || 'Company'
    : activeInquiry?.user?.name || 'Prospective Buyer';
  const counterpartyAvatar = isSentByMe
    ? activeInquiry?.company?.logoUrl
    : activeInquiry?.user?.avatarUrl;

  return (
    <AppShell contentMaxWidth="full" showRightSidebar={false}>
      <div className="w-full h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <aside
          className={`w-full md:w-72 lg:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0 ${
            isMobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h1 className="text-base font-bold text-slate-900">Messages & Inquiries</h1>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {inquiries.length}
              </span>
            </div>

            {/* Filter Tabs for Companies */}
            {isCompany && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('received')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'received'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Received (Leads)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sent')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'sent'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sent
                </button>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {inquiriesLoading ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading messages...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No conversations found</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery
                    ? 'Try searching with a different keyword.'
                    : 'When you contact a supplier or receive inquiries, your chats appear here.'}
                </p>
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = inq.id === selectedInquiryId;
                const sentByMe = inq.userId === user?.id;
                const name = sentByMe
                  ? inq.company?.name || 'Company'
                  : inq.user?.name || 'Buyer';
                const avatar = sentByMe ? inq.company?.logoUrl : inq.user?.avatarUrl;
                const lastMsg =
                  inq.messages && inq.messages.length > 0
                    ? inq.messages[inq.messages.length - 1].content
                    : inq.message;

                const isUnread =
                  (isCompany && (inq.status === 'UNREAD_FOR_COMPANY' || inq.status === 'UNREAD_BY_COMPANY')) ||
                  (!isCompany && (inq.status === 'UNREAD_FOR_USER' || inq.status === 'UNREAD_BY_USER'));

                return (
                  <button
                    key={inq.id}
                    type="button"
                    onClick={() => {
                      setSelectedInquiryId(inq.id);
                      setIsMobileThreadOpen(true);
                      markInquiryRead(inq.id);
                    }}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-primary-50/70 border-l-4 border-l-primary-600'
                        : isUnread
                        ? 'bg-primary-50/20 hover:bg-slate-100/70'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    <Avatar
                      name={name}
                      src={avatar || undefined}
                      size="sm"
                      className="shrink-0 mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-xs truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                            {name}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(inq.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Attached Product chip */}
                      {inq.product && (
                        <div className="flex items-center gap-1 text-[11px] text-primary-700 font-semibold truncate my-0.5">
                          <Package className="w-3 h-3 shrink-0" />
                          <span className="truncate">{inq.product.title}</span>
                        </div>
                      )}

                      {/* Latest Message preview */}
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {lastMsg}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Active Thread Canvas */}
        <main
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            !isMobileThreadOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedInquiryId && activeInquiry ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileThreadOpen(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    aria-label="Back to messages list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    name={counterpartyName}
                    src={counterpartyAvatar || undefined}
                    size="md"
                    className="shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {counterpartyName}
                      </h2>
                      {isSentByMe && activeInquiry.company?.verified && (
                        <VerifiedBadge showLabel={false} />
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 shrink-0">
                        {isSentByMe ? 'Supplier' : 'Prospective Buyer'}
                      </span>
                    </div>

                    {isSentByMe && activeInquiry.company?.slug && (
                      <Link
                        href={`/companies/${activeInquiry.company.slug}`}
                        target="_blank"
                        className="text-[11px] text-primary-600 hover:underline flex items-center gap-1 font-medium mt-0.5"
                      >
                        <span>View Company Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}

                    {!isSentByMe && activeInquiry.user?.email && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {activeInquiry.user.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attached Product Pill */}
                {activeInquiry.product && (
                  <Link
                    href={`/products/${activeInquiry.product.id}`}
                    target="_blank"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50/70 border border-primary-200/60 hover:bg-primary-100/70 transition-colors max-w-xs shrink-0"
                  >
                    {activeInquiry.product.images && activeInquiry.product.images.length > 0 && (
                      <img
                        src={activeInquiry.product.images[0]}
                        alt=""
                        className="w-7 h-7 rounded-md object-cover bg-white shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {activeInquiry.product.title}
                      </p>
                      {activeInquiry.product.price && (
                        <p className="text-[10px] text-primary-700 font-semibold">
                          ₹{activeInquiry.product.price} / {activeInquiry.product.priceUnit || 'unit'}
                        </p>
                      )}
                    </div>
                  </Link>
                )}
              </div>

              {/* Message History Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                {/* Initial Product Card if inquiry is product-based */}
                {activeInquiry.product && (
                  <div className="max-w-md mx-auto p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      {activeInquiry.product.images && activeInquiry.product.images.length > 0 ? (
                        <img
                          src={activeInquiry.product.images[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-primary-600 tracking-wider">
                        Inquiry Attached Product
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {activeInquiry.product.title}
                      </h4>
                      <p className="text-xs font-bold text-slate-700">
                        {activeInquiry.product.price
                          ? `₹${activeInquiry.product.price} / ${activeInquiry.product.priceUnit || 'unit'}`
                          : 'Price upon request'}
                        {activeInquiry.product.moq ? ` · MOQ: ${activeInquiry.product.moq}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages Bubbles */}
                {activeInquiry.messages && activeInquiry.messages.length > 0 ? (
                  activeInquiry.messages.map((msg) => {
                    const isMyMessage = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                          isMyMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <Avatar
                          name={msg.sender?.name || 'User'}
                          src={msg.sender?.avatarUrl || undefined}
                          size="xs"
                          className="shrink-0 mt-1"
                        />

                        <div className="space-y-1">
                          <div
                            className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                              isMyMessage
                                ? 'bg-primary-600 text-white rounded-tr-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                            }`}
                          >
                            {msg.content}
                          </div>

                          <div
                            className={`flex items-center gap-1.5 text-[10px] text-slate-400 px-1 ${
                              isMyMessage ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {msg.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                                <Power className="w-3 h-3 text-amber-500 animate-pulse" />
                                <span>Sending...</span>
                              </span>
                            ) : msg.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>Failed to send</span>
                              </span>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5" />
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMyMessage && (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No messages in this inquiry thread yet.
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0 flex items-center gap-2"
              >
                <textarea
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none max-h-32"
                />

                <Button
                  type="submit"
                  size="md"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  isLoading={sendMessageMutation.isPending}
                  className="shrink-0 rounded-xl px-4 font-bold"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            /* Empty state when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No conversation selected</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Choose a conversation from the left to read messages and reply to suppliers or buyers.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <AppShell contentMaxWidth="full" showRightSidebar={false}>
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 text-cobalt animate-spin" />
          </div>
        </AppShell>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
