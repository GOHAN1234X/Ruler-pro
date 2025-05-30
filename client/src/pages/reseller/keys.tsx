import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/nav-bar';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingOverlay } from '@/components/loading-overlay';
import { KeyCard } from '@/components/key-card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ResellerKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'expired', 'revoked'
  
  // State for reset key dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [keyToReset, setKeyToReset] = useState<number | null>(null);
  const [expiryDays, setExpiryDays] = useState('30');
  
  // Get reseller's keys query
  const { 
    data: keysData, 
    isLoading: keysLoading 
  } = useQuery({ 
    queryKey: ['/api/reseller/keys'] 
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
  
  // Reset key mutation
  const resetKeyMutation = useMutation({
    mutationFn: async ({ keyId, days }: { keyId: number, days: string }) => {
      const res = await apiRequest('POST', `/api/reseller/keys/${keyId}/reset`, { expiryDays: days });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/keys'] });
      toast({
        title: 'Key Reset',
        description: 'The key has been reset successfully. Device binding and expiry have been updated.',
        variant: 'default',
      });
      setResetDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Reset Key',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  });
  
  const handleRevokeKey = (keyId: number) => {
    if (confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
      revokeKeyMutation.mutate(keyId);
    }
  };
  
  const handleResetKey = (keyId: number) => {
    // Open dialog to enter expiry days
    setKeyToReset(keyId);
    setResetDialogOpen(true);
  };
  
  const confirmKeyReset = () => {
    if (keyToReset && !isNaN(parseInt(expiryDays)) && parseInt(expiryDays) > 0) {
      resetKeyMutation.mutate({ keyId: keyToReset, days: expiryDays });
    } else {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid number of days',
        variant: 'destructive',
      });
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
  
  const keys = keysData?.keys || [];
  
  // Filter keys
  const filteredKeys = keys.filter((key: any) => {
    // Filter by search term
    const matchesSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.game.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = key.isActive && new Date() < new Date(key.expiresAt);
    } else if (filterStatus === 'expired') {
      matchesStatus = new Date() >= new Date(key.expiresAt);
    } else if (filterStatus === 'revoked') {
      matchesStatus = !key.isActive;
    }
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort keys by creation date (newest first)
  const sortedKeys = [...filteredKeys].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const isLoading = keysLoading || revokeKeyMutation.isPending || resetKeyMutation.isPending;
  
  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Reseller" 
        activeItem="keys"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/reseller/dashboard' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/reseller/keys' },
          { id: 'history', label: 'History', icon: 'history', href: '/reseller/history' },
          { id: 'account', label: 'Account', icon: 'account_circle', href: '/reseller/account' }
        ]}
      />
      
      {/* Reset Key Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Key</DialogTitle>
            <DialogDescription>
              This will reset the device binding and expiry date for this key. 
              The key will work on new devices again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDays">New Expiry (days)</Label>
              <Input
                id="expiryDays"
                type="number"
                min="1"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="30"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Enter the number of days before the key will expire
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmKeyReset} disabled={resetKeyMutation.isPending}>
              {resetKeyMutation.isPending ? "Resetting..." : "Reset Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="px-6 py-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Key Management</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="w-full sm:w-[180px]">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="revoked">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {sortedKeys.length === 0 ? (
          <div className="text-center p-12 bg-card rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-4">
              <path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/>
              <path d="M16 3v4"/>
              <path d="M8 3v4"/>
              <path d="M3 11h18"/>
              <circle cx="16" cy="16" r="2"/>
              <path d="M18 16.5V12"/>
            </svg>
            <p className="text-muted-foreground">No keys found matching your filters</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/reseller/dashboard'}
            >
              Generate a New Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedKeys.map(key => (
              <KeyCard 
                key={key.id}
                keyData={key}
                onCopy={handleCopyKey}
                onRevoke={handleRevokeKey}
                onReset={handleResetKey}
                detailed
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
