import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NavBar } from '@/components/nav-bar';
import { useRequireAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function ResellerHistory() {
  useRequireAuth('reseller');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'week', 'month', 'year'
  
  // Get reseller's keys query
  const { 
    data: keysData, 
    isLoading: keysLoading 
  } = useQuery({ 
    queryKey: ['/api/reseller/keys'] 
  });
  
  const keys = keysData?.keys || [];
  
  // Sort keys by creation date (newest first)
  const sortedKeys = [...keys].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Filter keys by time period
  const filterKeysByTime = (keys: any[]) => {
    if (filterPeriod === 'all') return keys;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    if (filterPeriod === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (filterPeriod === 'year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return keys.filter(key => new Date(key.createdAt) >= cutoffDate);
  };
  
  // Filter keys by search term
  const filteredKeys = filterKeysByTime(sortedKeys).filter(key => 
    key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.game.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate statistics
  const totalKeysGenerated = keys.length;
  const activeKeys = keys.filter(key => 
    key.isActive && new Date() < new Date(key.expiresAt)
  ).length;
  const expiredKeys = keys.filter(key => 
    new Date() >= new Date(key.expiresAt)
  ).length;
  const revokedKeys = keys.filter(key => !key.isActive).length;
  
  return (
    <div className="min-h-screen bg-background">
      {keysLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Reseller" 
        activeItem="history"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/reseller/dashboard' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/reseller/keys' },
          { id: 'history', label: 'History', icon: 'history', href: '/reseller/history' },
          { id: 'account', label: 'Account', icon: 'account_circle', href: '/reseller/account' }
        ]}
      />
      
      <div className="px-6 py-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Key History</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm">Total Keys</div>
              <div className="text-2xl font-bold">{totalKeysGenerated}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm">Active</div>
              <div className="text-2xl font-bold text-green-500">{activeKeys}</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm">Expired</div>
              <div className="text-2xl font-bold text-amber-500">{expiredKeys}</div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm">Revoked</div>
              <div className="text-2xl font-bold text-destructive">{revokedKeys}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter History</CardTitle>
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
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground text-sm font-medium">Key</th>
                    <th className="text-left p-4 text-muted-foreground text-sm font-medium">Game</th>
                    <th className="text-left p-4 text-muted-foreground text-sm font-medium">Created</th>
                    <th className="text-left p-4 text-muted-foreground text-sm font-medium">Expiry</th>
                    <th className="text-left p-4 text-muted-foreground text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No keys found matching your filters
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const isActive = key.isActive && new Date() < new Date(key.expiresAt);
                      const isExpired = new Date() >= new Date(key.expiresAt);
                      const isRevoked = !key.isActive;
                      
                      let statusText = isActive ? "Active" : isExpired ? "Expired" : "Revoked";
                      let statusClass = isActive 
                        ? "bg-green-500 text-white" 
                        : isExpired 
                          ? "bg-amber-500 text-white" 
                          : "bg-destructive text-destructive-foreground";
                      
                      return (
                        <tr key={key.id} className="border-b border-border hover:bg-accent/5">
                          <td className="p-4 text-sm font-medium">{key.key}</td>
                          <td className="p-4 text-sm">{key.game}</td>
                          <td className="p-4 text-sm">{new Date(key.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-sm">{new Date(key.expiresAt).toLocaleDateString()}</td>
                          <td className="p-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
