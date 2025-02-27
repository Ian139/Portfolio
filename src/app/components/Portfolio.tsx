'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: number;
  title: string;
  description: string;
  link: string;
  tags: string[];
}

const projects: Project[] = [
  {
    id: 1,
    title: "SecureDAO",
    description: "FTM OlympusDAO fork.",
    link: "https://github.com/securedao",
    tags: ["TypeScript", "Solidity", "React"]
  },
  {
    id: 2,
    title: "Next Project",
    description: "Another interesting project with its own unique challenges and solutions.",
    link: "https://github.com",
    tags: ["Next.js", "Node.js", "MongoDB"]
  },
  {
    id: 3,
    title: "Cool Project",
    description: "A showcase of your best work with detailed implementation.",
    link: "https://github.com",
    tags: ["Python", "Django", "PostgreSQL"]
  }
];

export default function Portfolio() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-4"
        >
          Ian Rapko
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-zinc-400 mb-12"
        >
          Him
        </motion.p>

        <div className="space-y-6">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedId(selectedId === project.id ? null : project.id)}
                className="group cursor-pointer"
              >
                <div className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                      <p className="text-zinc-400 mb-4">{project.description}</p>
                      <div className="flex gap-2">
                        {project.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: selectedId === project.id ? 180 : 0 }}
                      className="text-zinc-500"
                    >
                      <svg 
                        className="w-6 h-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {selectedId === project.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-zinc-800"
                      >
                        <a 
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Project →
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 