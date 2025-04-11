import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NavBar } from '@/components/nav-bar';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const { toast } = useToast();
  const [getEndpointEnabled, setGetEndpointEnabled] = useState(true);
  const [postEndpointEnabled, setPostEndpointEnabled] = useState(true);
  
  const handleToggleEndpoint = (type: 'get' | 'post', enabled: boolean) => {
    if (type === 'get') {
      setGetEndpointEnabled(enabled);
    } else {
      setPostEndpointEnabled(enabled);
    }
    
    toast({
      title: `${type.toUpperCase()} Endpoint ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `The ${type.toUpperCase()} verification endpoint is now ${enabled ? 'active' : 'inactive'}`,
      variant: enabled ? 'default' : 'destructive',
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar 
        title="X-Ruler" 
        role="Admin" 
        activeItem="settings"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/admin/dashboard' },
          { id: 'resellers', label: 'Resellers', icon: 'people', href: '/admin/resellers' },
          { id: 'keys', label: 'Keys', icon: 'vpn_key', href: '/admin/keys' },
          { id: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }
        ]}
      />
      
      <div className="px-6 py-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">API Settings</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Key Verification Endpoints</CardTitle>
            <CardDescription>
              Configure the API endpoints used by applications to verify license keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">GET Endpoint</h3>
                  <p className="text-sm text-muted-foreground">
                    Allows verification via GET request with query parameters
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getEndpointEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                    {getEndpointEnabled ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={getEndpointEnabled}
                    onCheckedChange={(checked) => handleToggleEndpoint('get', checked)}
                  />
                </div>
              </div>
              
              <div className="bg-card/50 border border-border rounded-md p-3 text-sm font-mono overflow-x-auto">
                <code>GET /api/verify?key={'{key}'}&deviceId={'{deviceId}'}</code>
              </div>
              
              <div className="bg-card/50 border border-border rounded-md p-3 text-sm overflow-x-auto">
                <pre className="font-mono text-xs">Response:
{`{
  "success": true,
  "message": "Key validated successfully",
  "game": "Free Fire",
  "expiresAt": "2023-12-31T23:59:59.999Z"
}`}</pre>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">POST Endpoint</h3>
                  <p className="text-sm text-muted-foreground">
                    Allows verification via POST request with JSON body
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${postEndpointEnabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                    {postEndpointEnabled ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={postEndpointEnabled}
                    onCheckedChange={(checked) => handleToggleEndpoint('post', checked)}
                  />
                </div>
              </div>
              
              <div className="bg-card/50 border border-border rounded-md p-3 text-sm font-mono overflow-x-auto">
                <code>POST /api/verify</code>
              </div>
              
              <div className="bg-card/50 border border-border rounded-md p-3 text-sm overflow-x-auto">
                <pre className="font-mono text-xs">Request Body:
{`{
  "key": "YOUR_KEY",
  "deviceId": "DEVICE_ID"
}`}</pre>
              </div>
              
              <div className="bg-card/50 border border-border rounded-md p-3 text-sm overflow-x-auto">
                <pre className="font-mono text-xs">Response:
{`{
  "success": true,
  "message": "Key validated successfully",
  "game": "Free Fire",
  "expiresAt": "2023-12-31T23:59:59.999Z"
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
            <CardDescription>
              How to implement key verification in your applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Device ID</h3>
                <p className="text-sm text-muted-foreground">
                  The device ID should be a unique identifier for the device that cannot be easily changed by users.
                  Recommended options:
                </p>
                <ul className="list-disc list-inside mt-2 ml-2 text-sm text-muted-foreground">
                  <li>Android: ANDROID_ID or a combination of hardware identifiers</li>
                  <li>iOS: identifierForVendor or keychain-stored UUID</li>
                  <li>Desktop: Hardware serial numbers or MAC address hash</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Error Handling</h3>
                <p className="text-sm text-muted-foreground">
                  Handle API errors gracefully in your application:
                </p>
                <ul className="list-disc list-inside mt-2 ml-2 text-sm text-muted-foreground">
                  <li>401/404: Invalid key</li>
                  <li>403: Key revoked or expired</li>
                  <li>403: Device limit reached</li>
                  <li>500: Server error, retry with exponential backoff</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Security Recommendations</h3>
                <ul className="list-disc list-inside mt-2 ml-2 text-sm text-muted-foreground">
                  <li>Store the key securely (e.g., encrypted storage)</li>
                  <li>Implement certificate pinning for API requests</li>
                  <li>Add an app signature check to prevent tampering</li>
                  <li>Regularly validate the key, not just at startup</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
