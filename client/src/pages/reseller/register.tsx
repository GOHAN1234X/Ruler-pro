import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from "framer-motion";
import { LoadingOverlay } from '@/components/loading-overlay';

interface RegisterData {
  username: string;
  password: string;
  referralToken: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralToken, setReferralToken] = useState('');
  
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
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information",
        variant: "destructive",
      });
    }
  });
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username || !password || !confirmPassword || !referralToken) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate({
      username,
      password,
      referralToken
    });
  };
  
  const goToLogin = () => {
    setLocation('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-10 animate-in fade-in">
      {registerMutation.isPending && <LoadingOverlay />}
      
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
        <p>Reseller Registration</p>
      </div>
      
      <div className="w-full max-w-sm mx-auto mt-4">
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
                  onClick={goToLogin}
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
                  <Label htmlFor="username" className="text-sm font-medium text-muted-foreground mb-2">
                    Username
                  </Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Choose a username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="password" className="text-sm font-medium text-muted-foreground mb-2">
                    Password
                  </Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Create password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-muted-foreground mb-2">
                    Confirm Password
                  </Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  disabled={registerMutation.isPending}
                >
                  <span>Register Account</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                </Button>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={goToLogin}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    Already have an account? Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
