"use client";

import { useState } from "react";
import { Modal, Typography, Button, cn } from "@/components/ui";
import { Copy, Check, Send, ExternalLink, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onShareInternal?: () => void;
}

export function ShareModal({ open, onClose, url, title, onShareInternal }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share">
      <div className="space-y-6 py-4">
        <Typography variant="body2" className="text-slate-500 font-medium text-center">
          Share &ldquo;{title}&rdquo;
        </Typography>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-slate-200 dark:border-white/10">
          <LinkIcon size={16} className="text-slate-400 shrink-0" />
          <Typography variant="caption" className="text-slate-500 truncate flex-1">
            {url}
          </Typography>
          <button
            onClick={handleCopyLink}
            className={cn(
              "shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all",
              copied ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-black dark:hover:text-white"
            )}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <ShareButton
            icon={<Twitter size={20} />}
            label="Twitter"
            onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank"); onClose(); }}
          />
          <ShareButton
            icon={<Linkedin size={20} />}
            label="LinkedIn"
            onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank"); onClose(); }}
          />
          <ShareButton
            icon={<Send size={20} />}
            label="Direct"
            onClick={() => { onShareInternal?.(); onClose(); }}
          />
          <ShareButton
            icon={<ExternalLink size={20} />}
            label="Open"
            onClick={() => { window.open(url, "_blank"); onClose(); }}
          />
        </div>

        <Button fullWidth variant="outline" className="rounded-xl" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

function ShareButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200 dark:border-white/10 transition-all group"
    >
      <div className="text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">{icon}</div>
      <Typography variant="caption" fontWeight={700} className="text-slate-500 group-hover:text-primary transition-colors">
        {label}
      </Typography>
    </button>
  );
}
