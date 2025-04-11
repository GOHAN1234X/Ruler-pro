import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/nav-bar';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function AdminKeys() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'expired', 'revoked'
  const [filterGame, setFilterGame] = useState('all');
  
  // Get keys query
  const { 
    data: keysData, 
    isLoading: keysLoading 
  } = useQuery({ 
    queryKey: ['/api/admin/keys'] 
  });
  
  const keys = keysData?.keys || [];
  
  // Filter keys
  const filteredKeys = keys.filter((key: any) => {
    // Filter by search term
    const matchesSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        key.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = key.isActive && new Date() < new Date(key.expiresAt);
    } else if (filterStatus === 'expired') {
      matchesStatus = new Date() >= new Date(key.expiresAt);
    } else if (filterStatus === 'revoked') {
      matchesStatus = !key.isActive;
    }
    
    // Filter by game
    const matchesGame = filterGame === 'all' || key.game === filterGame;
    
    return matchesSearch && matchesStatus && matchesGame;
  });
  
  // Get unique game names
  const gameNames = Array.from(new Set(keys.map((key: any) => key.game)));
  
  return (
    <div className="min-h-screen bg-background">
      {keysLoading && <LoadingOverlay />}
      
      <NavBar 
        title="X-Ruler" 
        role="Admin" 
        activeItem="keys"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard' },
          { id: 'resellers', label: 'Resellers', icon: 'people', href: '/admin/resellers' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/admin/keys' },
          { id: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }
        ]}
      />
      
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
                  placeholder="Search keys or resellers..."
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
              
              <div className="w-full sm:w-[180px]">
                <Select value={filterGame} onValueChange={setFilterGame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Game" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    {gameNames.map(game => (
                      <SelectItem key={game} value={game}>{game}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border font-medium text-sm">
            <div className="col-span-3">Key</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Game</div>
            <div className="col-span-2">Reseller</div>
            <div className="col-span-2">Devices</div>
            <div className="col-span-1">Expires</div>
          </div>
          
          {filteredKeys.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No keys found matching the filters
            </div>
          ) : (
            filteredKeys.map((key: any) => {
              const isActive = key.isActive && new Date() < new Date(key.expiresAt);
              const isExpired = new Date() >= new Date(key.expiresAt);
              const isRevoked = !key.isActive;
              
              let statusBadgeClass = '';
              let statusText = '';
              
              if (isActive) {
                statusBadgeClass = 'bg-primary text-primary-foreground';
                statusText = 'Active';
              } else if (isExpired) {
                statusBadgeClass = 'bg-destructive text-destructive-foreground';
                statusText = 'Expired';
              } else {
                statusBadgeClass = 'bg-destructive text-destructive-foreground';
                statusText = 'Revoked';
              }
              
              return (
                <div key={key.id} className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm hover:bg-accent/5 transition-colors">
                  <div className="col-span-3 font-medium truncate">{key.key}</div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="col-span-2">{key.game}</div>
                  <div className="col-span-2 truncate">{key.createdBy}</div>
                  <div className="col-span-2">0/{key.deviceLimit}</div>
                  <div className="col-span-1">{new Date(key.expiresAt).toLocaleDateString()}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
