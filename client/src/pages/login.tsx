import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FaKey, FaUser, FaUserPlus } from 'react-icons/fa';
import { motion } from "framer-motion";
import { LoadingOverlay } from '@/components/loading-overlay';

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData extends LoginData {
  referralToken: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'admin' | 'reseller'>('admin');
  const [showRegister, setShowRegister] = useState(false);
  
  // Form states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [resellerUsername, setResellerUsername] = useState('');
  const [resellerPassword, setResellerPassword] = useState('');
  
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [referralToken, setReferralToken] = useState('');
  
  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest('POST', '/api/admin/login', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "Welcome to X-Ruler Admin Panel",
        variant: "default",
      });
      setLocation('/admin/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  });
  
  // Reseller login mutation
  const resellerLoginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest('POST', '/api/reseller/login', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "Welcome to X-Ruler Reseller Panel",
        variant: "default",
      });
      setLocation('/reseller/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  });
  
  // Reseller register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest('POST', '/api/reseller/register', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "You can now log in with your credentials",
        variant: "default",
      });
      setShowRegister(false);
      setActiveTab('reseller');
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information",
        variant: "destructive",
      });
    }
  });
  
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate({ username: adminUsername, password: adminPassword });
  };
  
  const handleResellerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    resellerLoginMutation.mutate({ username: resellerUsername, password: resellerPassword });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      referralToken
    });
  };
  
  const isPending = adminLoginMutation.isPending || resellerLoginMutation.isPending || registerMutation.isPending;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/90 px-6 py-10 animate-in fade-in">
      {isPending && <LoadingOverlay />}
      
      <motion.div 
        className="flex flex-col items-center justify-center mb-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-6xl font-bold text-center text-primary mb-1">
          <span className="inline-block transform hover:scale-105 transition-transform duration-300">X-Ruler</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <div className="h-1 w-10 bg-primary/30 rounded-full"></div>
          <FaKey className="text-primary/70" size={16} />
          <div className="h-1 w-10 bg-primary/30 rounded-full"></div>
        </div>
      </motion.div>
      
      <div className="w-full max-w-sm mx-auto mt-6">
        {!showRegister ? (
          <>
            {/* Login Tabs */}
            <div className="flex mb-6 bg-card rounded-lg">
              <Button
                variant={activeTab === 'admin' ? 'default' : 'outline'}
                className={`flex-1 py-6 rounded-l-lg ${activeTab === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </Button>
              <Button
                variant={activeTab === 'reseller' ? 'default' : 'outline'}
                className={`flex-1 py-6 rounded-r-lg ${activeTab === 'reseller' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                onClick={() => setActiveTab('reseller')}
              >
                Reseller
              </Button>
            </div>
            
            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="slide-up"
              >
                <Card className="border border-primary/10 shadow-lg shadow-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                      >
                        <FaUser className="h-6 w-6 text-primary" />
                      </motion.div>
                      <h2 className="text-2xl font-semibold">Admin Login</h2>
                      <p className="text-sm text-muted-foreground mt-1">Access the control panel</p>
                    </div>
                    
                    <form onSubmit={handleAdminLogin}>
                      <div className="mb-4">
                        <Label htmlFor="admin-username" className="text-sm font-medium mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username
                        </Label>
                        <Input 
                          id="admin-username" 
                          type="text" 
                          placeholder="admin" 
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="bg-background/60 ring-offset-primary focus-visible:ring-primary/20"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <Label htmlFor="admin-password" className="text-sm font-medium mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Password
                        </Label>
                        <Input 
                          id="admin-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="bg-background/60 ring-offset-primary focus-visible:ring-primary/20"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full py-6 text-base font-medium"
                      >
                        <span>Login to Dashboard</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Reseller Login Form */}
            {activeTab === 'reseller' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-primary/10 shadow-lg shadow-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                      >
                        <FaKey className="h-6 w-6 text-primary" />
                      </motion.div>
                      <h2 className="text-2xl font-semibold">Reseller Login</h2>
                      <p className="text-sm text-muted-foreground mt-1">Access your key management</p>
                    </div>
                    
                    <form onSubmit={handleResellerLogin}>
                      <div className="mb-4">
                        <Label htmlFor="reseller-username" className="text-sm font-medium mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username
                        </Label>
                        <Input 
                          id="reseller-username" 
                          type="text" 
                          placeholder="Your username" 
                          value={resellerUsername}
                          onChange={(e) => setResellerUsername(e.target.value)}
                          className="bg-background/60 ring-offset-primary focus-visible:ring-primary/20"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <Label htmlFor="reseller-password" className="text-sm font-medium mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Password
                        </Label>
                        <Input 
                          id="reseller-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={resellerPassword}
                          onChange={(e) => setResellerPassword(e.target.value)}
                          className="bg-background/60 ring-offset-primary focus-visible:ring-primary/20"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full py-6 text-base font-medium"
                      >
                        <span>Login to Dashboard</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Button>
                      
                      <div className="mt-6 text-center">
                        <Button
                          variant="outline"
                          className="text-primary hover:text-primary/90 text-sm font-medium border-primary/20 hover:bg-primary/5"
                          onClick={() => setShowRegister(true)}
                        >
                          <FaUserPlus className="mr-2 h-4 w-4" />
                          Register as Reseller
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        ) : (
          /* Reseller Register Form */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-primary/10 shadow-lg shadow-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-6 relative">
                  <Button 
                    variant="ghost" 
                    className="absolute left-0 p-2 text-muted-foreground hover:text-primary" 
                    onClick={() => setShowRegister(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                      <path d="m12 19-7-7 7-7"/>
                      <path d="M19 12H5"/>
                    </svg>
                  </Button>
                  <div className="text-center">
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4"
                    >
                      <FaUserPlus className="h-6 w-6 text-secondary" />
                    </motion.div>
                    <h2 className="text-2xl font-semibold">Reseller Registration</h2>
                    <p className="text-sm text-muted-foreground mt-1">Create your reseller account</p>
                  </div>
                </div>
                
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <Label htmlFor="register-username" className="text-sm font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Username
                    </Label>
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="Choose a username" 
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="bg-background/60 ring-offset-secondary focus-visible:ring-secondary/20"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="register-password" className="text-sm font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                    </Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="Create password" 
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-background/60 ring-offset-secondary focus-visible:ring-secondary/20"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="referral-token" className="text-sm font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Referral Token
                    </Label>
                    <Input 
                      id="referral-token" 
                      type="text" 
                      placeholder="Enter admin provided token" 
                      value={referralToken}
                      onChange={(e) => setReferralToken(e.target.value)}
                      className="bg-background/60 ring-offset-secondary focus-visible:ring-secondary/20"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full py-6 text-base font-medium"
                  >
                    <span>Create Account</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
