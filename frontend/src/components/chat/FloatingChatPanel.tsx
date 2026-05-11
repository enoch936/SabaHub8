"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@/lib/chatStore';

interface FloatingChatPanelProps {
	isOpen: boolean;
	onToggle: () => void;
}

export function FloatingChatPanel({ isOpen, onToggle }: FloatingChatPanelProps) {
	const {
		conversations,
		messages,
		typingUsers,
		currentUserId,
		fetchConversations,
		fetchMessages,
		sendMessage,
		getTotalUnread,
		getConversationTitle,
	} = useChatStore();

	const conv = conversations[0];
	const convId = conv?.id;
	const convMessages = convId ? (messages[convId] ?? []) : [];
	const isTyping = convId ? (typingUsers[convId]?.size ?? 0) > 0 : false;
	const totalUnread = getTotalUnread();

	useEffect(() => {
		if (conversations.length === 0) {
			void fetchConversations();
		}
	}, [conversations.length, fetchConversations]);

	useEffect(() => {
		if (isOpen && convId && !messages[convId]) {
			void fetchMessages(convId);
		}
	}, [isOpen, convId, messages, fetchMessages]);

	const handleSend = (content: string) => {
		if (!convId) return;
		void sendMessage(convId, content, 'TEXT');
	};

	return (
		<div className="fixed bottom-6 right-6 z-40">
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						className="sheet-panel mb-3 w-80 overflow-hidden"
					>
						<div className="flex items-center justify-between border-b border-[var(--border)] bg-primary p-3 text-primary-foreground">
							<div className="flex items-center gap-2">
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
									{(getConversationTitle(conv).charAt(0) || 'C').toUpperCase()}
								</div>
								<div>
									<p className="text-sm font-medium">{getConversationTitle(conv)}</p>
									<p className="text-xs opacity-70">Live</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<button onClick={onToggle} className="rounded p-1 transition-colors hover:bg-white/20"><Minimize2 className="h-4 w-4" /></button>
								<button onClick={onToggle} className="rounded p-1 transition-colors hover:bg-white/20"><X className="h-4 w-4" /></button>
							</div>
						</div>

						<div className="h-64 space-y-3 overflow-y-auto p-3">
							{convMessages.map((msg) => {
								const isMine = Boolean(currentUserId && msg.senderId === currentUserId);
								return (
									<div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
										<div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-[var(--accent)]'}`}>
											<p>{msg.type === 'ASSET' ? '[Attachment]' : (msg.text || '')}</p>
											<p className={`mt-0.5 text-xs ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
												{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
											</p>
										</div>
									</div>
								);
							})}
							{isTyping && (
								<div className="flex justify-start">
									<TypingIndicator />
								</div>
							)}
						</div>
						<MessageInput onSend={handleSend} />
					</motion.div>
				)}
			</AnimatePresence>

			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={onToggle}
				className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
			>
				{isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
				{!isOpen && totalUnread > 0 && (
					<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
						{totalUnread > 9 ? '9+' : totalUnread}
					</span>
				)}
			</motion.button>
		</div>
	);
}
