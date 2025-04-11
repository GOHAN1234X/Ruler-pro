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
    <div className="min-h-screen flex flex-col bg-background px-6 py-10 animate-in fade-in">
      {isPending && <LoadingOverlay />}
      
      <motion.div 
        className="flex justify-center mb-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-5xl font-bold text-center text-primary">
          <span className="inline-block transform hover:scale-105 transition-transform duration-300">X-Ruler</span>
        </div>
      </motion.div>
      
      <div className="my-6 text-center text-muted-foreground">
        <p>Admin & Reseller Key Management</p>
      </div>
      
      <div className="w-full max-w-sm mx-auto mt-4">
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
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-medium mb-6">Admin Login</h2>
                    
                    <form onSubmit={handleAdminLogin}>
                      <div className="mb-4">
                        <Label htmlFor="admin-username" className="text-sm font-medium text-muted-foreground mb-2">
                          Username
                        </Label>
                        <Input 
                          id="admin-username" 
                          type="text" 
                          placeholder="admin" 
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <Label htmlFor="admin-password" className="text-sm font-medium text-muted-foreground mb-2">
                          Password
                        </Label>
                        <Input 
                          id="admin-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                      >
                        <span>Login</span>
                        <FaUser className="ml-2" />
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
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-medium mb-6">Reseller Login</h2>
                    
                    <form onSubmit={handleResellerLogin}>
                      <div className="mb-4">
                        <Label htmlFor="reseller-username" className="text-sm font-medium text-muted-foreground mb-2">
                          Username
                        </Label>
                        <Input 
                          id="reseller-username" 
                          type="text" 
                          placeholder="Your username" 
                          value={resellerUsername}
                          onChange={(e) => setResellerUsername(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <Label htmlFor="reseller-password" className="text-sm font-medium text-muted-foreground mb-2">
                          Password
                        </Label>
                        <Input 
                          id="reseller-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={resellerPassword}
                          onChange={(e) => setResellerPassword(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                      >
                        <span>Login</span>
                        <FaUser className="ml-2" />
                      </Button>
                      
                      <div className="mt-4 text-center">
                        <Button
                          variant="link"
                          className="text-secondary hover:text-opacity-80 text-sm font-medium"
                          onClick={() => setShowRegister(true)}
                        >
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-6">
                  <Button 
                    variant="ghost" 
                    className="mr-2 p-2" 
                    onClick={() => setShowRegister(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                      <path d="m12 19-7-7 7-7"/>
                      <path d="M19 12H5"/>
                    </svg>
                  </Button>
                  <h2 className="text-xl font-medium">Reseller Registration</h2>
                </div>
                
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <Label htmlFor="register-username" className="text-sm font-medium text-muted-foreground mb-2">
                      Username
                    </Label>
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="Choose a username" 
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="register-password" className="text-sm font-medium text-muted-foreground mb-2">
                      Password
                    </Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="Create password" 
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <Label htmlFor="referral-token" className="text-sm font-medium text-muted-foreground mb-2">
                      Referral Token
                    </Label>
                    <Input 
                      id="referral-token" 
                      type="text" 
                      placeholder="Enter admin provided token" 
                      value={referralToken}
                      onChange={(e) => setReferralToken(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full"
                  >
                    <span>Register Account</span>
                    <FaUserPlus className="ml-2" />
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
