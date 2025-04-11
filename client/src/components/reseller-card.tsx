import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaUser, FaTrash, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";

interface ResellerCardProps {
  reseller: {
    id: number;
    username: string;
    credits: number;
  };
  onAddCredits: (id: number, credits: number) => void;
  onDelete: (id: number) => void;
}

export function ResellerCard({ reseller, onAddCredits, onDelete }: ResellerCardProps) {
  const [credits, setCredits] = useState<string>("");
  
  const handleAddCredits = () => {
    const creditsNumber = parseInt(credits);
    if (!isNaN(creditsNumber) && creditsNumber > 0) {
      onAddCredits(reseller.id, creditsNumber);
      setCredits("");
    }
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
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <FaUser className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{reseller.username}</h3>
                <p className="text-sm text-muted-foreground">Credits: {reseller.credits}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-destructive hover:text-destructive/80"
              onClick={() => onDelete(reseller.id)}
            >
              <FaTrash />
            </Button>
          </div>
          
          <div className="mt-4 bg-background rounded-lg p-2 flex flex-wrap items-center gap-2">
            <Input
              type="number"
              placeholder="Add credits"
              min="1"
              className="w-28 text-sm"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
            <Button
              variant="default"
              size="sm"
              className="text-sm"
              onClick={handleAddCredits}
              disabled={!credits || isNaN(parseInt(credits)) || parseInt(credits) <= 0}
            >
              <FaPlus className="mr-1" size={12} />
              Add Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
