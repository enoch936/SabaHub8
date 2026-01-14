'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  Star,
  Send,
  ChevronDown,
  X
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: string;
  projectType: string;
  requiredSkills: string[];
  employerName: string;
  employerRating: number;
  postedAt: string;
  proposalCount: number;
}

export default function ProjectSearch() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    minBudget: '',
    maxBudget: '',
    projectType: '',
    experienceLevel: '',
    skills: [] as string[]
  });

  const categories = [
    'Web Development',
    'Mobile Development',
    'Design',
    'Data Science',
    'Writing',
    'Marketing',
    'Video & Animation',
    'Music & Audio'
  ];

  const projectTypes = ['FIXED', 'HOURLY'];
  const experienceLevels = ['ENTRY', 'INTERMEDIATE', 'EXPERT'];

  useEffect(() => {
    searchProjects();
  }, []);

  const searchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        keyword: searchTerm,
        ...(filters.categories.length && { categories: filters.categories.join(',') }),
        ...(filters.minBudget && { minBudget: filters.minBudget }),
        ...(filters.maxBudget && { maxBudget: filters.maxBudget }),
        ...(filters.projectType && { projectType: filters.projectType }),
        ...(filters.experienceLevel && { experienceLevel: filters.experienceLevel })
      });

      const res = await fetch(`/api/freelancer/projects/search?${params}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (error) {
      console.error('Error searching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Next Project</h1>
          <p className="text-gray-600">Discover opportunities that match your skills</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchProjects()}
                placeholder="Search projects by title, skills, or keywords..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={searchProjects}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Search
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-4 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-blue-500 transition-all flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </motion.button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          filters.categories.includes(category)
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Budget Range */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Budget Range</h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={filters.minBudget}
                      onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                      placeholder="Min Budget"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={filters.maxBudget}
                      onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                      placeholder="Max Budget"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Project Type & Experience */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Project Type</h3>
                    <div className="flex gap-2">
                      {projectTypes.map((type) => (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilters({ ...filters, projectType: type })}
                          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                            filters.projectType === type
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Experience Level</h3>
                    <select
                      value={filters.experienceLevel}
                      onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">All Levels</option>
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex items-center justify-between"
        >
          <p className="text-gray-600">
            Found <span className="font-bold text-gray-900">{projects.length}</span> projects
          </p>
          {filters.categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.categories.map((cat) => (
                <motion.span
                  key={cat}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold flex items-center gap-1"
                >
                  {cat}
                  <X className="w-4 h-4 cursor-pointer" onClick={() => toggleCategory(cat)} />
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Project Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Link href={`/freelancer/projects/${project.id}`}>
                      <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-2">
                        {project.title}
                      </h2>
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {project.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {project.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        project.experienceLevel === 'EXPERT' ? 'bg-purple-100 text-purple-700' :
                        project.experienceLevel === 'INTERMEDIATE' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {project.experienceLevel}
                      </span>
                    </div>
                  </div>

                  <Link href={`/freelancer/projects/${project.id}/apply`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Apply Now
                    </motion.button>
                  </Link>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{project.description}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {project.employerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{project.employerName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{project.employerRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {project.proposalCount} proposals
                    </p>
                    <p className="text-sm text-gray-500">
                      Posted {new Date(project.postedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
