import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .insert([
          { 
            username: username.toLowerCase().trim(), 
            real_email: email.trim(),
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Request sent to admin!');
    } catch (error: any) {
      console.error('Error submitting reset request:', error);
      toast.error('Failed to send request. Please ensure you have run the SQL setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
        >
          {/* Decorative Header */}
          <div className="bg-primary p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Forgot Credentials?</h2>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">We'll help you get back in</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-gray-500 font-medium text-center leading-relaxed">
                  Enter your username and the email address where you'd like to receive your temporary password.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        placeholder="Your church username"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Real Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none font-medium text-gray-700"
                        placeholder="Where to send the password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm uppercase tracking-widest"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Request to Admin
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900">Request Received!</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    The admin has been notified. Please check your email (<strong>{email}</strong>) shortly for your temporary login credentials.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-sm"
                >
                  Back to Login
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
