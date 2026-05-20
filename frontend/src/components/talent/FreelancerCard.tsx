"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Star, 
  CheckCircle, 
  MapPin, 
  Briefcase, 
  User, 
  ShieldCheck, 
  Zap, 
  Eye, 
  UserPlus, 
  Clock, 
  Layers 
} from "lucide-react";
import type { FreelancerProfile } from "@/lib/types";
import { workspaceRoutes } from "@/lib/workspace-routes";

interface FreelancerCardProps {
  profile: FreelancerProfile;
  onHire: (id: string) => void;
  onPreview: (id: string) => void;
}

const glassStyles = {
  base: "backdrop-blur-md bg-white/40 border border-white/20 shadow-sm transition-all duration-300",
  hover: "hover:bg-gray-100/50 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] hover:border-white/40",
  action: "backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/30 text-gray-800 transition-all active:scale-95",
};

export function FreelancerCard({ profile, onHire, onPreview }: FreelancerCardProps) {
  const freelancerProfileHref = workspaceRoutes.publicProfile("freelancer", profile.id);

  const availabilityColor = profile.availability === 'AVAILABLE' 
    ? 'bg-emerald-500' 
    : profile.availability === 'BUSY' 
      ? 'bg-amber-500' 
      : 'bg-slate-400';

  return (
    <div
      className={`group relative rounded-[32px] ${glassStyles.base} ${glassStyles.hover} p-4 cursor-pointer overflow-hidden flex flex-col h-[440px] transition-all duration-500 hover:scale-[1.02]`}
      onClick={() => onPreview(profile.id)}
    >
      {/* Content View */}
      <div className="flex flex-col h-full transition-all duration-500">
        {/* MASSIVE SQUARE HERO Visual Part */}
        <div className="relative -mx-4 -mt-4 mb-4 aspect-square shrink-0 overflow-hidden bg-gray-950 group-hover:brightness-90 transition-all duration-500 border-b border-white/10">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              alt={profile.displayName} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white/20 text-6xl font-black uppercase">
              {profile.displayName.charAt(0)}
            </div>
          )}
          
          {/* Overlay Status Bar */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
          
          <div className="absolute top-3 left-4 right-4 flex justify-between items-start z-20">
            <div className="flex flex-wrap gap-1.5">
              <span className={`${availabilityColor} text-white text-[7px] font-black px-2 py-0.5 rounded-md shadow-2xl uppercase tracking-widest flex items-center gap-1`}>
                <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                {profile.availability}
              </span>
            </div>
            {profile.isVerified && (
              <div className="p-1.5 rounded-xl bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 text-blue-400 shadow-xl">
                <ShieldCheck className="h-3.5 w-3.5 fill-current" />
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 z-20">
             <div className="flex items-center gap-1.5 text-white/90">
               <span className="flex items-center gap-0.5 text-[10px] font-black bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                 <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                 {profile.rating}
               </span>
               <span className="text-[9px] font-bold text-white/60">({profile.reviewCount} reviews)</span>
             </div>
          </div>
        </div>

        {/* Dynamic Partition */}
        <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
          <div className="min-w-0">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className="font-black text-gray-950 text-[16px] leading-[1.1] line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                {profile.displayName}
              </h3>
              <Link 
                href={freelancerProfileHref}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-gray-200"
                title="View Profile"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3">
              <Layers className="h-3 w-3" />
              {profile.title}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-gray-600 font-medium line-clamp-2 leading-tight">
                {profile.bio}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="text-[7px] font-black px-2 py-0.5 rounded-lg bg-gray-100/50 border border-gray-200/50 text-gray-500 uppercase tracking-tight">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 py-3 mt-4 border-t border-white/30">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Rate</span>
                <span className="text-[12px] font-black text-gray-950 tracking-tighter">
                  ${profile.hourlyRate}/hr
                </span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Momentum</span>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[9px] font-black text-gray-900 uppercase">
                    {profile.completedJobs} Missions
                  </span>
                  <Zap className="h-3 w-3 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Overlay - Bottom 25% on Hover */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 z-20 flex items-center justify-center p-4 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 bg-white/40 backdrop-blur-xl border-t border-white/40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pointer-events-none group-hover:pointer-events-auto">
        <div className="w-full flex gap-3 px-2">
          <button
            onClick={(e) => { e.stopPropagation(); onHire(profile.id); }}
            className={`flex-1 h-10 rounded-2xl bg-gray-950 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl hover:bg-gray-800 transition-all active:scale-95`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Hire Now
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(profile.id); }}
            className={`h-10 w-10 rounded-2xl bg-white/80 text-gray-950 border border-gray-200 flex items-center justify-center shadow-xl hover:bg-white transition-all active:scale-95`}
            title="Profile Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
