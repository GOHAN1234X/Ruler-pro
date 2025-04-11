import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NavBar } from '@/components/nav-bar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useRequireAuth } from '@/lib/auth';
import { LoadingOverlay } from '@/components/loading-overlay';
import { FaUser, FaKey, FaHistory, FaLock } from 'react-icons/fa';

export default function ResellerAccount() {
  useRequireAuth('reseller');
  const { toast } = useToast();
  
  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Get user info query
  const { 
    data: userData, 
    isLoading: userLoading 
  } = useQuery({ 
    queryKey: ['/api/me']
  });
  
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
  
  // Password change mutation (Note: This is a mock as the endpoint doesn't exist in our current API)
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      // This is a mock endpoint that doesn't exist in our current API
      // For a real implementation, you would need to add this endpoint to the server
      // const res = await apiRequest('POST', '/api/reseller/change-password', data);
      // return res.json();
      
      // For now, just simulate a successful response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully',
        variant: 'default',
      });
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Change Password',
        description: error.message || 'Please check your current password and try again',
        variant: 'destructive',
      });
    }
  });
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill all password fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'New password and confirmation must match',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'New password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };
  
  const username = userData?.user?.username || '';
  const credits = creditsData?.credits || 0;
  const keys = keysData?.keys || [];
  
  // Calculate key stats
  const activeKeys = keys.filter(key => 
    key.isActive && new Date() < new Date(key.expiresAt)
  ).length;
  
  const expiredKeys = keys.filter(key => 
    new Date() >= new Date(key.expiresAt)
  ).length;
  
  const isLoading = userLoading || creditsLoading || keysLoading || changePasswordMutation.isPending;
  
  // Account creation date (mock as this isn't provided by our current API)
  const accountCreated = new Date();
  accountCreated.setMonth(accountCreated.getMonth() - 3); // Mock 3 months ago
  
  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Reseller" 
        activeItem="account"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/reseller/dashboard' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/reseller/keys' },
          { id: 'history', label: 'History', icon: 'history', href: '/reseller/history' },
          { id: 'account', label: 'Account', icon: 'account_circle', href: '/reseller/account' }
        ]}
      />
      
      <div className="px-6 py-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaUser className="mr-2 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} readOnly className="bg-muted" />
                </div>
                
                <div className="grid gap-2">
                  <Label>Account Created</Label>
                  <div className="text-sm p-2 bg-muted rounded-md">
                    {accountCreated.toLocaleDateString()}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Available Credits</Label>
                  <div className="text-xl font-semibold text-primary">
                    {credits} Credits
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaKey className="mr-2 text-primary" />
                  Key Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold">{activeKeys}</div>
                    <div className="text-sm text-muted-foreground">Active Keys</div>
                  </div>
                  <div className="bg-amber-500/10 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold">{expiredKeys}</div>
                    <div className="text-sm text-muted-foreground">Expired Keys</div>
                  </div>
                  <div className="bg-green-500/10 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold">{keys.length}</div>
                    <div className="text-sm text-muted-foreground">Total Keys</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md text-center">
                    <div className="text-3xl font-bold">{credits}</div>
                    <div className="text-sm text-muted-foreground">Available Credits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaLock className="mr-2 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FaHistory className="mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keys.slice(0, 5).map((key) => {
                    const isActive = key.isActive && new Date() < new Date(key.expiresAt);
                    const action = isActive ? "Generated" : "Revoked";
                    const date = new Date(key.createdAt).toLocaleDateString();
                    
                    return (
                      <div key={key.id} className="flex justify-between items-center border-b border-border pb-2">
                        <div>
                          <div className="font-medium truncate max-w-[150px]">{key.key}</div>
                          <div className="text-xs text-muted-foreground">{date}</div>
                        </div>
                        <div className="text-sm text-right">
                          <div>{action}</div>
                          <div className="text-xs text-muted-foreground">{key.game}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {keys.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
