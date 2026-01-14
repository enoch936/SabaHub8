'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Briefcase,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Globe,
  Award,
  Upload,
  Plus,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';
import Image from 'next/image';

interface Skill {
  id?: string;
  name: string;
  level: string;
  yearsOfExperience: number;
}

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  images: string[];
  projectUrl?: string;
  category: string;
  technologies: string[];
  testimonial?: {
    text: string;
    clientName: string;
    clientCompany: string;
  };
}

interface Certification {
  id?: string;
  name: string;
  issuedBy: string;
  credentialId?: string;
  credentialUrl?: string;
  issuedDate: string;
  expiryDate?: string;
}

interface FreelancerProfile {
  id: string;
  professionalTitle: string;
  bio: string;
  profilePicture?: string;
  coverImage?: string;
  location: string;
  timezone: string;
  languages: string[];
  hourlyRate: number;
  currency: string;
  availability: string;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  skills: Skill[];
  portfolio: PortfolioItem[];
  certifications: Certification[];
}

export default function FreelancerProfile() {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<FreelancerProfile>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/freelancer/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/freelancer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedProfile)
      });
      if (res.ok) {
        setProfile(await res.json());
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const addSkill = async (skill: Skill) => {
    try {
      const res = await fetch('/api/freelancer/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(skill)
      });
      if (res.ok) {
        await fetchProfile();
        setShowSkillModal(false);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'certifications', label: 'Certifications', icon: Award }
  ];

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
      >
        {profile.coverImage && (
          <Image src={profile.coverImage} alt="Cover" layout="fill" objectFit="cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10 pb-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Picture */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center overflow-hidden">
                  {profile.profilePicture ? (
                    <Image src={profile.profilePicture} alt="Profile" width={160} height={160} objectFit="cover" />
                  ) : (
                    <User className="w-20 h-20 text-gray-400" />
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-full shadow-lg"
              >
                <Upload className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.professionalTitle || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, professionalTitle: e.target.value })}
                      className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900">{profile.professionalTitle}</h1>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      {profile.timezone}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  {isEditing ? <><Save className="w-5 h-5" /> Save</> : <><Edit2 className="w-5 h-5" /> Edit Profile</>}
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Rating', value: `${profile.rating.toFixed(1)} ⭐`, icon: Star, color: 'yellow' },
                  { label: 'Reviews', value: profile.reviewCount, icon: Star, color: 'blue' },
                  { label: 'Projects', value: profile.completedProjects, icon: Briefcase, color: 'green' },
                  { label: 'Hourly Rate', value: `$${profile.hourlyRate}`, icon: DollarSign, color: 'purple' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl"
                  >
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Bio */}
              <div className="mt-6">
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'skills' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSkillModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Skill
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.skills.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100"
                  >
                    <h3 className="font-bold text-gray-900">{skill.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        skill.level === 'EXPERT' ? 'bg-purple-200 text-purple-800' :
                        skill.level === 'ADVANCED' ? 'bg-blue-200 text-blue-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {skill.level}
                      </span>
                      <span className="text-sm text-gray-600">{skill.yearsOfExperience} years</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPortfolioModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Project
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.portfolio.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                  >
                    {item.images[0] && (
                      <div className="relative h-48">
                        <Image src={item.images[0]} alt={item.title} layout="fill" objectFit="cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.technologies.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {item.projectUrl && (
                        <a
                          href={item.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                        >
                          <Globe className="w-4 h-4" />
                          View Project
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'certifications' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCertModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Certification
                </motion.button>
              </div>

              <div className="space-y-4">
                {profile.certifications.map((cert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-100"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{cert.name}</h3>
                      <p className="text-gray-600">{cert.issuedBy}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                        {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Verify
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
