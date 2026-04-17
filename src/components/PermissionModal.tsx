import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Bell, Image as ImageIcon, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const PermissionModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenPermissions = localStorage.getItem('hasSeenPermissions');
    if (!hasSeenPermissions) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    // In a real app, we would trigger the actual browser permission prompts here
    try {
      // Request Notification permission
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
      
      // Request Camera permission (optional, just to trigger the browser prompt)
      // await navigator.mediaDevices.getUserMedia({ video: true });
      
    } catch (err) {
      console.log('Permissions declined or not supported', err);
    }

    localStorage.setItem('hasSeenPermissions', 'true');
    setIsOpen(false);
  };

  const permissions = [
    {
      icon: Bell,
      title: 'Notifications',
      desc: 'Get real-time updates on services, events, and important church announcements.',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: Camera,
      title: 'Camera & Media',
      desc: 'Allow access to upload your profile picture and share moments with the community.',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy First',
      desc: 'Your data is encrypted and used only to enhance your spiritual experience.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header Image/Pattern */}
            <div className="h-32 bg-gradient-to-br from-primary to-purple-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full -mr-16 -mb-16 blur-3xl" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-display font-black text-gray-900 tracking-tight">
                  Enhance Your Experience
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Allow St. Peter's App to provide you with a fully personalized and connected experience.
                </p>
              </div>

              <div className="space-y-6">
                {permissions.map((item, idx) => (
                  <motion.div 
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex gap-4 group"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", item.bg)}>
                      <item.icon className={cn("w-6 h-6", item.color)} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAllow}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                >
                  Enable All Permissions
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
