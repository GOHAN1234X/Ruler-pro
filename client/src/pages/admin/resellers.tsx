import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavBar } from '@/components/nav-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { LoadingOverlay } from '@/components/loading-overlay';
import { ResellerCard } from '@/components/reseller-card';

export default function AdminResellers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [referralToken, setReferralToken] = useState('');
  
  // Get resellers query
  const { 
    data: resellersData, 
    isLoading: resellersLoading 
  } = useQuery({ 
    queryKey: ['/api/admin/resellers']
  });
  
  // Generate referral token mutation
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/referral-token', {});
      return res.json();
    },
    onSuccess: (data) => {
      setReferralToken(data.token.token);
      toast({
        title: 'Token Generated',
        description: 'New referral token has been created',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Generate Token',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ id, credits }: { id: number, credits: number }) => {
      const res = await apiRequest('POST', `/api/admin/resellers/${id}/credits`, { credits });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resellers'] });
      toast({
        title: 'Credits Added',
        description: 'Credits have been added to the reseller',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Credits',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  // Delete reseller mutation
  const deleteResellerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/resellers/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resellers'] });
      toast({
        title: 'Reseller Deleted',
        description: 'Reseller has been removed',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Delete Reseller',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  const handleGenerateToken = () => {
    generateTokenMutation.mutate();
  };
  
  const handleCopyToken = () => {
    navigator.clipboard.writeText(referralToken);
    toast({
      title: 'Token Copied',
      description: 'Token has been copied to clipboard',
      variant: 'default',
    });
  };
  
  const handleAddCredits = (id: number, credits: number) => {
    if (isNaN(credits) || credits <= 0) {
      toast({
        title: 'Invalid Credits',
        description: 'Please enter a valid number of credits',
        variant: 'destructive',
      });
      return;
    }
    
    addCreditsMutation.mutate({ id, credits });
  };
  
  const handleDeleteReseller = (id: number) => {
    if (confirm('Are you sure you want to delete this reseller?')) {
      deleteResellerMutation.mutate(id);
    }
  };
  
  const isLoading = resellersLoading || 
                    generateTokenMutation.isPending || 
                    addCreditsMutation.isPending || 
                    deleteResellerMutation.isPending;
  
  const resellers = resellersData?.resellers || [];
  
  // Filter resellers by search term
  const filteredResellers = resellers.filter((reseller: any) => 
    reseller.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Admin" 
        activeItem="resellers"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard' },
          { id: 'resellers', label: 'Resellers', icon: 'people', href: '/admin/resellers' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/admin/keys' },
          { id: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }
        ]}
      />
      
      <div className="px-6 py-4 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reseller Management</h1>
          <div className="flex items-center">
            <Input
              type="text"
              placeholder="Search resellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-[200px] mr-2"
            />
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Generate Referral Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Generate a referral token to allow new resellers to register
              </p>
              <Button
                onClick={handleGenerateToken}
                variant="default"
                disabled={generateTokenMutation.isPending}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Generate Token
              </Button>
            </div>
            
            <div className="flex items-center bg-background rounded-lg overflow-hidden border border-input">
              <Input
                type="text"
                value={referralToken}
                readOnly
                className="border-0 flex-grow"
                placeholder="Generated token will appear here"
              />
              <Button 
                variant="ghost" 
                onClick={handleCopyToken}
                disabled={!referralToken}
                className="p-2 text-muted-foreground hover:text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredResellers.length === 0 ? (
            <div className="text-center p-8 bg-card rounded-lg">
              <p className="text-muted-foreground">No resellers found</p>
            </div>
          ) : (
            filteredResellers.map((reseller: any) => (
              <ResellerCard
                key={reseller.id}
                reseller={reseller}
                onAddCredits={handleAddCredits}
                onDelete={handleDeleteReseller}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
