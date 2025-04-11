import { Key } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaKey, FaCopy, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";

interface KeyCardProps {
  keyData: Key;
  onCopy: (key: string) => void;
  onRevoke: (keyId: number) => void;
  detailed?: boolean;
}

export function KeyCard({ keyData, onCopy, onRevoke, detailed = false }: KeyCardProps) {
  const isActive = keyData.isActive && new Date() < new Date(keyData.expiresAt);
  const isExpiring = isActive && new Date(keyData.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
  const isExpired = new Date() >= new Date(keyData.expiresAt);
  
  let statusText = isActive ? (isExpiring ? "Expiring Soon" : "Active") : isExpired ? "Expired" : "Revoked";
  let statusClass = isActive ? (isExpiring ? "bg-orange-500 text-white" : "bg-green-500 text-white") : "bg-destructive text-destructive-foreground";
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FaKey className="text-primary mr-2" />
              <span className="font-medium">{keyData.key}</span>
            </div>
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                {statusText}
              </span>
            </div>
          </div>
          
          <div className={`grid ${detailed ? 'grid-cols-2' : 'grid-cols-2'} gap-2 mt-3 text-sm`}>
            <div className="bg-background rounded p-2">
              <span className="text-muted-foreground">Game: </span>
              <span>{keyData.game}</span>
            </div>
            <div className="bg-background rounded p-2">
              <span className="text-muted-foreground">Device Limit: </span>
              <span>{keyData.deviceLimit}</span>
            </div>
            <div className="bg-background rounded p-2">
              <span className="text-muted-foreground">Created: </span>
              <span>{formatDate(keyData.createdAt)}</span>
            </div>
            <div className="bg-background rounded p-2">
              <span className="text-muted-foreground">Expires: </span>
              <span>{formatDate(keyData.expiresAt)}</span>
            </div>
          </div>
          
          {detailed && (
            <div className="mt-3 bg-background rounded p-2">
              <span className="text-muted-foreground">Status: </span>
              <span>
                {isActive ? "Valid and active" : isExpired ? "Expired on " + formatDate(keyData.expiresAt) : "Revoked manually"}
              </span>
            </div>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <Button 
              variant="link" 
              className="text-primary text-sm flex items-center p-0"
              onClick={() => onCopy(keyData.key)}
            >
              <FaCopy className="mr-1" size={12} />
              <span>Copy Key</span>
            </Button>
            
            {isActive && (
              <Button 
                variant="link" 
                className="text-destructive text-sm flex items-center p-0"
                onClick={() => onRevoke(keyData.id)}
              >
                <FaTrash className="mr-1" size={12} />
                <span>Revoke</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
