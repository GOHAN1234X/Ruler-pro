import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavBar } from '@/components/nav-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FaClipboard, FaUsers, FaKey } from 'react-icons/fa';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [referralToken, setReferralToken] = useState('');
  
  // Get resellers query
  const { 
    data: resellersData, 
    isLoading: resellersLoading 
  } = useQuery({ 
    queryKey: ['/api/admin/resellers']
  });
  
  // Get keys query
  const { 
    data: keysData, 
    isLoading: keysLoading 
  } = useQuery({ 
    queryKey: ['/api/admin/keys'] 
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
  
  const isLoading = resellersLoading || keysLoading || 
                    generateTokenMutation.isPending || 
                    addCreditsMutation.isPending || 
                    deleteResellerMutation.isPending;
  
  const resellers = resellersData?.resellers || [];
  const keys = keysData?.keys || [];
  
  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Admin" 
        activeItem="dashboard"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard' },
          { id: 'resellers', label: 'Resellers', icon: 'people', href: '/admin/resellers' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/admin/keys' },
          { id: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }
        ]}
      />
      
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Total Resellers</p>
              <p className="text-2xl font-medium">{resellers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm mb-1">Active Keys</p>
              <p className="text-2xl font-medium">
                {keys.filter(key => key.isActive).length}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Manage Resellers</h2>
          
          {/* Add Reseller Card */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium">Add Referral Token</h3>
                <Button
                  onClick={handleGenerateToken}
                  className="bg-primary text-white text-sm px-3 py-1 h-auto"
                  disabled={generateTokenMutation.isPending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M5 12h14"/>
                    <path d="M12 5v14"/>
                  </svg>
                  Generate
                </Button>
              </div>
              
              <div className="flex items-center bg-background rounded-lg overflow-hidden border border-input">
                <Input
                  type="text"
                  value={referralToken}
                  readOnly
                  className="border-0 flex-grow"
                  placeholder="Generate a token"
                />
                <Button 
                  variant="ghost" 
                  onClick={handleCopyToken}
                  disabled={!referralToken}
                  className="p-2 text-muted-foreground hover:text-primary"
                >
                  <FaClipboard />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Reseller List */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {resellers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No resellers found
                </div>
              ) : (
                resellers.map((reseller: any) => (
                  <div key={reseller.id} className="border-b border-border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">{reseller.username}</h3>
                        <p className="text-sm text-muted-foreground">Credits: {reseller.credits}</p>
                      </div>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-green-500 mr-3"
                          disabled={addCreditsMutation.isPending}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v8"/>
                            <path d="M8 12h8"/>
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteReseller(reseller.id)}
                          disabled={deleteResellerMutation.isPending}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            <line x1="10" x2="10" y1="11" y2="17"/>
                            <line x1="14" x2="14" y1="11" y2="17"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-background rounded-lg p-2 flex items-center">
                      <Input
                        type="number"
                        placeholder="Add credits"
                        min="1"
                        className="w-20 mr-2"
                        onChange={(e) => {
                          // Component will use this pattern for local state management
                          // But we don't need to track credits for each user separately in this example
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const creditsInput = (e.currentTarget.previousSibling as HTMLInputElement);
                          const credits = parseInt(creditsInput.value);
                          handleAddCredits(reseller.id, credits);
                          creditsInput.value = '';
                        }}
                        className="bg-primary text-white text-sm h-auto py-1"
                        disabled={addCreditsMutation.isPending}
                      >
                        Add Credits
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Key Management</h2>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium">All Generated Keys</h3>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search keys..."
                    className="pr-8 text-sm"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
              </div>
              
              {/* Key List */}
              <div className="bg-background rounded-lg overflow-hidden">
                {keys.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No keys found
                  </div>
                ) : (
                  keys.slice(0, 5).map((key: any) => {
                    const isActive = key.isActive && new Date() < new Date(key.expiresAt);
                    const isExpired = new Date() >= new Date(key.expiresAt);
                    
                    return (
                      <div key={key.id} className="border-b border-border p-3 text-sm">
                        <div className="flex flex-wrap justify-between items-center">
                          <div className="mb-1">
                            <span className="font-medium mr-2">{key.key}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : isExpired ? 'bg-destructive text-white' : 'bg-destructive text-white'}`}>
                              {isActive ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            <span className="mx-2">|</span>
                            <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-between mt-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Owner: </span>
                            <span>{key.createdBy}</span>
                            <span className="mx-2">|</span>
                            <span className="text-muted-foreground">Game: </span>
                            <span>{key.game}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Devices: </span>
                            <span>0/{key.deviceLimit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  className="text-primary hover:text-opacity-80 text-sm font-medium mx-auto flex items-center"
                  onClick={() => window.location.href = '/admin/keys'}
                >
                  <span>View All Keys</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
