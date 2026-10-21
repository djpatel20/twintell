'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../lib/api-client';
import { getSocket } from '../../lib/socket';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/Badge';
import { Inquiry, InquiryMessage } from '../../types';
import {
  X,
  Send,
  Building2,
  Package,
  AlertCircle,
  MessageSquare,
  Loader2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Power,
  CheckCheck,
  Clock,
} from 'lucide-react';

export interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyVerified?: boolean;
  productId?: string | null;
  productTitle?: string | null;
  productPrice?: number | null;
  productPriceUnit?: string | null;
  productMoq?: number | null;
  productImage?: string | null;
  initialInquiryId?: string | null;
}

export function InquiryModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  companyLogo,
  companyVerified,
  productId,
  productTitle,
  productPrice,
  productPriceUnit,
  productMoq,
  productImage,
  initialInquiryId = null,
}: InquiryModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { markInquiryRead } = useNotifications();
  const queryClient = useQueryClient();

  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(initialInquiryId);
  const [initialMessage, setInitialMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark inquiry as read when viewing conversation in modal
  useEffect(() => {
    if (activeInquiryId && isOpen) {
      markInquiryRead(activeInquiryId);
    }
  }, [activeInquiryId, isOpen, markInquiryRead]);

  // Initialize predefined template whenever product / company changes
  useEffect(() => {
    setActiveInquiryId(initialInquiryId);
    if (productTitle) {
      setInitialMessage(
        `Hi ${companyName},\n\nWe are interested in your product "${productTitle}". Please share pricing for bulk quantities, minimum order lead time, and specifications.`
      );
    } else {
      setInitialMessage(
        `Hi ${companyName},\n\nWe would like to connect regarding your manufacturing and wholesale supply capabilities.`
      );
    }
  }, [initialInquiryId, companyName, productTitle]);

  // Fetch full inquiry conversation if an inquiry is active
  const {
    data: inquiryData,
    isLoading: isLoadingConversation,
    refetch: refetchConversation,
  } = useQuery({
    queryKey: ['inquiry-thread', activeInquiryId],
    queryFn: () => api.get<{ data: Inquiry }>(`/api/inquiries/${activeInquiryId}`),
    enabled: !!activeInquiryId && isOpen,
    refetchInterval: 3000, // Real-time polling fallback
  });

  const activeInquiry = inquiryData?.data;
  const messages: InquiryMessage[] = activeInquiry?.messages || [];

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Real-time socket listener for incoming inquiry messages
  useEffect(() => {
    if (!activeInquiryId || !isOpen) return;

    let isMounted = true;
    getSocket()
      .then((socket) => {
        if (!isMounted) return;

        const handleNewInquiryMsg = (payload: any) => {
          if (payload?.inquiryId === activeInquiryId) {
            queryClient.invalidateQueries({ queryKey: ['inquiry-thread', activeInquiryId] });
            queryClient.invalidateQueries({ queryKey: ['user-inquiries'] });
            queryClient.invalidateQueries({ queryKey: ['company-inquiries'] });
          }
        };

        socket.on('inquiry:message', handleNewInquiryMsg);
        return () => {
          socket.off('inquiry:message', handleNewInquiryMsg);
        };
      })
      .catch((err) => {
        console.warn('Socket connection error in InquiryModal:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeInquiryId, isOpen, queryClient]);

  const isCurrentUserBuyer = activeInquiry ? activeInquiry.userId === user?.id : true;
  const headerName = activeInquiry
    ? isCurrentUserBuyer
      ? activeInquiry.company?.name || companyName
      : activeInquiry.user?.name || 'Prospective Buyer'
    : companyName;
  const headerLogo = activeInquiry
    ? isCurrentUserBuyer
      ? activeInquiry.company?.logoUrl || companyLogo
      : activeInquiry.user?.avatarUrl
    : companyLogo;
  const isHeaderVerified = activeInquiry
    ? isCurrentUserBuyer
      ? !!activeInquiry.company?.verified
      : false
    : !!companyVerified;
  const counterpartyRole = activeInquiry
    ? isCurrentUserBuyer
      ? 'Verified Supplier'
      : 'Procurement Buyer'
    : 'Supplier';

  if (!isOpen) return null;

  // Handle submitting initial predefined inquiry
  const handleStartInquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    if (initialMessage.trim().length < 10) {
      setErrorMsg('Please write an inquiry message (at least 10 characters).');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<{ data: Inquiry; message: string }>('/api/inquiries', {
        companyId,
        productId: productId || null,
        message: initialMessage.trim(),
      });

      // Switch straight into real-time Chat interface
      setActiveInquiryId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['company-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['user-inquiries'] });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sending follow-up chat message in ongoing thread with instant optimistic UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeInquiryId) return;

    const content = chatInput.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: InquiryMessage = {
      id: tempId,
      inquiryId: activeInquiryId,
      senderId: user?.id || '',
      content,
      createdAt: new Date().toISOString(),
      status: 'pending',
      sender: {
        id: user?.id || '',
        name: user?.name || 'You',
        avatarUrl: user?.avatarUrl || null,
      },
    };

    // Immediately update UI cache
    queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', activeInquiryId], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          messages: [...(old.data.messages || []), optimisticMsg],
        },
      };
    });

    setChatInput('');
    setErrorMsg(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await api.post<{ data: InquiryMessage }>(`/api/inquiries/${activeInquiryId}/messages`, {
        content,
      });

      // Reconcile optimistic message with server response
      queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', activeInquiryId], (old) => {
        if (!old) return old;
        const filtered = (old.data.messages || []).filter((m) => m.id !== tempId);
        return {
          ...old,
          data: {
            ...old.data,
            messages: [...filtered, { ...res.data, status: 'sent' }],
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ['user-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['company-inquiries'] });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send message. Please retry.');
      queryClient.setQueryData<{ data: Inquiry }>(['inquiry-thread', activeInquiryId], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            messages: (old.data.messages || []).map((m) =>
              m.id === tempId ? { ...m, status: 'failed' as const } : m
            ),
          },
        };
      });
    }
  };

  const quickQuestions = [
    '📦 What is the bulk MOQ & volume discount?',
    '🚚 What is your estimated lead time & dispatch?',
    '📄 Can you share technical specs or sample?',
    '✨ Do you support custom branding / private label?',
  ];

  const handleAppendQuickQuestion = (q: string) => {
    setInitialMessage((prev) => {
      if (prev.includes(q)) return prev;
      return `${prev}\n\n• ${q}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl lg:max-w-4xl w-full overflow-hidden flex flex-col h-[680px] max-h-[92vh]">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={headerName}
              src={headerLogo || undefined}
              size="sm"
              className="rounded-lg shrink-0 border border-slate-200"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 truncate">{headerName}</h3>
                {isHeaderVerified && <VerifiedBadge showLabel={false} />}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeInquiryId ? `${counterpartyRole} • Live RFQ Chat` : 'Direct Inquiry Desk'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeInquiryId && (
              <Link
                href={`/messages?inquiryId=${activeInquiryId}`}
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Open in Full Messages Page"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attached Product Snippet Bar */}
        {(productTitle || activeInquiry?.product) && (
          <div className="bg-primary-50/60 border-b border-primary-100/70 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-white border border-primary-200 flex items-center justify-center overflow-hidden shrink-0">
                {(productImage || activeInquiry?.product?.images?.[0]) ? (
                  <img
                    src={productImage || activeInquiry?.product?.images?.[0]}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-3.5 h-3.5 text-primary-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {productTitle || activeInquiry?.product?.title}
                </p>
                <p className="text-[10px] text-slate-500">
                  {productPrice || activeInquiry?.product?.price
                    ? `₹${productPrice || activeInquiry?.product?.price} / ${productPriceUnit || activeInquiry?.product?.priceUnit || 'unit'}`
                    : 'Custom Quotation'}
                  {(productMoq || activeInquiry?.product?.moq) && ` • Min MOQ: ${productMoq || activeInquiry?.product?.moq}`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-full shrink-0">
              Product RFQ
            </span>
          </div>
        )}

        {/* BODY: Mode 1 = Initial Predefined Inquiry Form */}
        {!activeInquiryId ? (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Predefined message box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    <span>Inquiry / Starting Message</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{initialMessage.length}/2000</span>
                </div>
                <textarea
                  value={initialMessage}
                  onChange={(e) => {
                    setInitialMessage(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  rows={5}
                  maxLength={2000}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  placeholder="Ask regarding price, MOQ, lead times, delivery..."
                />
              </div>

              {/* Predefined Quick Action Chips */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Quick Topics to Add:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAppendQuickQuestion(q)}
                      className="text-[11px] bg-slate-100 hover:bg-primary-50 hover:text-primary-600 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Starts an interactive chat with supplier
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleStartInquiry}
                  isLoading={isSubmitting}
                  disabled={initialMessage.trim().length < 10}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="font-bold shadow-sm"
                >
                  Start Chat & Send
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* BODY: Mode 2 = Full Interactive Real-Time Chat Thread */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
            {/* Scrollable Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingConversation ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <p className="text-xs">Loading conversation thread...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">No chat messages yet.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.senderId === user?.id;
                  const senderDisplayName = isCurrentUser
                    ? 'You'
                    : msg.sender?.name || (isCurrentUserBuyer ? companyName : activeInquiry?.user?.name || 'Buyer');
                  const senderAvatar = isCurrentUser
                    ? user?.avatarUrl
                    : msg.sender?.avatarUrl || (isCurrentUserBuyer ? companyLogo : activeInquiry?.user?.avatarUrl);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <Avatar
                          name={senderDisplayName}
                          src={senderAvatar || undefined}
                          size="xs"
                          className="mt-1 shrink-0"
                        />
                      )}

                      <div className={`max-w-[78%] space-y-1`}>
                        {!isCurrentUser && (
                          <span className="text-[10px] font-bold text-slate-500 px-1">
                            {senderDisplayName}
                          </span>
                        )}

                        <div
                          className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-xs ${
                            isCurrentUser
                              ? 'bg-primary-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[9px] text-slate-400 px-1 ${
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                              <Power className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                              <span>Sending...</span>
                            </span>
                          ) : msg.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
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
                              {isCurrentUser && (
                                <CheckCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if send failed */}
            {errorMsg && (
              <div className="px-4 py-2 bg-rose-50 text-rose-700 text-xs border-t border-rose-200 flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-500 hover:text-rose-800 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Bottom Message Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message or response..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <Button
                size="sm"
                type="submit"
                disabled={!chatInput.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
                className="font-bold shrink-0"
              >
                Send
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
