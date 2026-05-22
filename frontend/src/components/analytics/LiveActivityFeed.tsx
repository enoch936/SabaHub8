"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  CreditCard, 
  ShieldAlert, 
  Upload, 
  LogIn, 
  Rocket, 
  AlertTriangle,
  Clock,
  ExternalLink,
  Activity
} from 'lucide-react';
import { subscribeLiveActivities } from '@/lib/ws';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  badge?: string;
  metadata?: Record<string, any>;
}

const getActivityConfig = (type: string) => {
  switch (type) {
    case 'USER_REGISTRATION':
      return { icon: UserPlus, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' };
    case 'PAYMENT':
      return { icon: CreditCard, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' };
    case 'MODERATION':
      return { icon: ShieldAlert, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' };
    case 'UPLOAD':
      return { icon: Upload, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' };
    case 'LOGIN':
      return { icon: LogIn, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' };
    case 'DEPLOYMENT':
      return { icon: Rocket, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' };
    case 'REPORT':
      return { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' };
    default:
      return { icon: Activity, color: 'text-gray-500', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20' };
  }
};

const LiveActivityFeed: React.FC<{ limit?: number; className?: string }> = ({ limit = 20, className = "" }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial fetch could be added here if there was an API for history
    
    const sub = subscribeLiveActivities((data) => {
      const event = data as unknown as ActivityEvent;
      setActivities((prev) => [event, ...prev].slice(0, limit));
      setIsLive(true);
      
      // Optional: Play a subtle sound
      // if (audioRef.current) audioRef.current.play().catch(() => {});
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [limit]);

  return (
    <div className={`flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
          <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            Live Activity Feed
          </h3>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
          Real-time
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Waiting for live events...</p>
            <p className="text-xs opacity-50 mt-1 italic">Activities will appear here as they happen</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {activities.map((activity) => {
              const config = getActivityConfig(activity.type);
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 12 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
                  className={`relative group border ${config.borderColor} ${config.bgColor} rounded-lg p-3 overflow-hidden`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 shadow-lg ${config.color} bg-slate-900`}>
                      {activity.avatarUrl ? (
                        <img src={activity.avatarUrl} alt={activity.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {activity.message}
                      </p>
                      
                      {activity.username && (
                        <div className="mt-2 flex items-center gap-2">
                           <span className="text-[11px] text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800/50 flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full bg-slate-500" />
                             @{activity.username}
                           </span>
                           {activity.badge && (
                             <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                               activity.badge === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                               activity.badge === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                               activity.badge === 'danger' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                               'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                             }`}>
                               {activity.badge}
                             </span>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Decorative glow effect on hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full`} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
      
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Showing last {limit} events</span>
        <div className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <span>View Archive</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.2);
        }
      `}</style>
    </div>
  );
};

export default LiveActivityFeed;
