import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/nav-bar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FaKey, FaInfoCircle } from 'react-icons/fa';
import { LoadingOverlay } from '@/components/loading-overlay';
import { KeyCard } from '@/components/key-card';

export default function ResellerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [game, setGame] = useState('Free Fire');
  const [deviceLimit, setDeviceLimit] = useState('1');
  const [expiryDays, setExpiryDays] = useState('30');
  const [customKeyEnabled, setCustomKeyEnabled] = useState(false);
  const [customKey, setCustomKey] = useState('');
  
  // Key generation result
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // Get user info query
  const { data: userData, isLoading: userLoading } = useQuery({ queryKey: ['/api/me'] });
  
  // Get reseller's credits query
  const { 
    data: creditsData, 
    isLoading: creditsLoading 
  } = useQuery({ 
    queryKey: ['/api/reseller/credits'] 
  });
  
  // Get reseller's keys query
  const { 
    data: keysData, 
    isLoading: keysLoading 
  } = useQuery({ 
    queryKey: ['/api/reseller/keys'] 
  });
  
  // Generate key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (keyData: any) => {
      const res = await apiRequest('POST', '/api/reseller/keys', keyData);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      setShowKeyModal(true);
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/keys'] });
      
      // Reset form
      setCustomKeyEnabled(false);
      setCustomKey('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Generate Key',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  // Revoke key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await apiRequest('DELETE', `/api/reseller/keys/${keyId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/keys'] });
      toast({
        title: 'Key Revoked',
        description: 'The key has been revoked successfully',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Revoke Key',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!game || !deviceLimit || !expiryDays) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (parseInt(expiryDays) < 1 || parseInt(expiryDays) > 365) {
      toast({
        title: 'Invalid Expiry',
        description: 'Expiry days must be between 1 and 365',
        variant: 'destructive',
      });
      return;
    }
    
    const keyData = {
      game,
      deviceLimit,
      expiryDays,
      customKey: customKeyEnabled ? customKey : null
    };
    
    generateKeyMutation.mutate(keyData);
  };
  
  const handleRevokeKey = (keyId: number) => {
    if (confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
      revokeKeyMutation.mutate(keyId);
    }
  };
  
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Key Copied',
      description: 'Key has been copied to clipboard',
      variant: 'default',
    });
  };
  
  const closeKeyModal = () => {
    setShowKeyModal(false);
  };
  
  const isLoading = userLoading || creditsLoading || keysLoading || 
                    generateKeyMutation.isPending || revokeKeyMutation.isPending;
  
  const username = userData?.user?.username || '';
  const credits = creditsData?.credits || 0;
  const keys = keysData?.keys || [];
  
  // Sort keys by creation date (newest first)
  const sortedKeys = [...keys].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Active keys (not expired and not revoked)
  const activeKeys = sortedKeys.filter(key => 
    key.isActive && new Date() < new Date(key.expiresAt)
  );
  
  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Reseller" 
        activeItem="dashboard"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/reseller/dashboard' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/reseller/keys' },
          { id: 'history', label: 'History', icon: 'history', href: '/reseller/history' },
          { id: 'account', label: 'Account', icon: 'account_circle', href: '/reseller/account' }
        ]}
      />
      
      <div className="px-6 py-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium">Hello, {username}</h2>
            <p className="text-muted-foreground">Welcome back to your dashboard</p>
          </div>
          <div className="bg-card rounded-full px-4 py-2 flex items-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-1">
              <rect width="20" height="14" x="2" y="5" rx="2"/>
              <line x1="2" x2="22" y1="10" y2="10"/>
            </svg>
            <span className="font-medium">{credits} Credits</span>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Generate New Key</h2>
          
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleGenerateKey}>
                <div className="mb-4">
                  <Label htmlFor="game-select" className="text-sm font-medium text-muted-foreground mb-2">
                    Select Game
                  </Label>
                  <Select value={game} onValueChange={setGame}>
                    <SelectTrigger id="game-select" className="w-full bg-background">
                      <SelectValue placeholder="Select a game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                      <SelectItem value="More Games Coming Soon" disabled>More Games Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="device-limit" className="text-sm font-medium text-muted-foreground mb-2">
                    Device Limit
                  </Label>
                  <Select value={deviceLimit} onValueChange={setDeviceLimit}>
                    <SelectTrigger id="device-limit" className="w-full bg-background">
                      <SelectValue placeholder="Select device limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Device</SelectItem>
                      <SelectItem value="2">2 Devices</SelectItem>
                      <SelectItem value="100">100 Devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="expiry-days" className="text-sm font-medium text-muted-foreground mb-2">
                    Expiry (Days)
                  </Label>
                  <Input 
                    id="expiry-days" 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="bg-background"
                  />
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="custom-key" className="text-sm font-medium text-muted-foreground">
                      Custom Key (Optional)
                    </Label>
                    <div className="flex items-center">
                      <Switch 
                        id="custom-key-toggle"
                        checked={customKeyEnabled}
                        onCheckedChange={setCustomKeyEnabled}
                      />
                    </div>
                  </div>
                  <Input 
                    id="custom-key" 
                    type="text" 
                    placeholder="Enter custom key format" 
                    disabled={!customKeyEnabled}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className={`bg-background ${!customKeyEnabled ? 'opacity-50' : ''}`}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm flex items-center">
                    <FaInfoCircle className="text-amber-500 mr-1" />
                    <span>This will use 1 credit</span>
                  </div>
                  <Button 
                    type="submit" 
                    variant="secondary"
                    disabled={generateKeyMutation.isPending || credits < 1}
                    className="flex items-center"
                  >
                    <span>Generate Key</span>
                    <FaKey className="ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Your Keys</h2>
          
          {activeKeys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  You don't have any active keys. Generate one using the form above.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeKeys.slice(0, 3).map(key => (
                <KeyCard 
                  key={key.id}
                  keyData={key}
                  onCopy={handleCopyKey}
                  onRevoke={handleRevokeKey}
                />
              ))}
              
              {activeKeys.length > 3 && (
                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    className="text-primary"
                    onClick={() => window.location.href = '/reseller/keys'}
                  >
                    View All Keys
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Key Generation Modal */}
      {showKeyModal && generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-10">
            <div className="text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3 className="text-xl font-medium mt-2">Key Generated!</h3>
            </div>
            
            <div className="bg-background rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Your Key:</p>
              <div className="flex items-center justify-between">
                <p className="font-medium break-all">{generatedKey.key}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary"
                  onClick={() => handleCopyKey(generatedKey.key)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="bg-background rounded p-2">
                <span className="text-muted-foreground">Game: </span>
                <span>{generatedKey.game}</span>
              </div>
              <div className="bg-background rounded p-2">
                <span className="text-muted-foreground">Device Limit: </span>
                <span>{generatedKey.deviceLimit}</span>
              </div>
              <div className="bg-background rounded p-2">
                <span className="text-muted-foreground">Created: </span>
                <span>{new Date(generatedKey.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="bg-background rounded p-2">
                <span className="text-muted-foreground">Expires: </span>
                <span>{new Date(generatedKey.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">Credit used: 1</p>
              <Button onClick={closeKeyModal} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
