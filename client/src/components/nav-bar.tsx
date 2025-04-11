import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

interface NavBarProps {
  title: string;
  role: string;
  activeItem?: string;
  items: NavItem[];
}

export function NavBar({ title, role, activeItem, items }: NavBarProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(false);
  
  useEffect(() => {
    if (isMenuOpen) {
      // Add slight delay to show backdrop after menu opens
      const timer = setTimeout(() => setShowBackdrop(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowBackdrop(false);
    }
  }, [isMenuOpen]);
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
        variant: "default",
      });
      
      // Clear any cached data
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <>
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-medium text-primary">{title}</span>
            <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md">
              {role}
            </span>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={toggleMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Sidebar for larger screens */}
      <div className="hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-card border-r border-border p-4">
        <nav className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <a className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                activeItem === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}>
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 flex justify-around lg:hidden z-10">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <a className="flex flex-col items-center">
              <span className={`material-icons ${
                activeItem === item.id ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.icon}
              </span>
              <span className={`text-xs mt-1 ${
                activeItem === item.id ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </a>
          </Link>
        ))}
      </div>
      
      {/* Mobile menu backdrop */}
      {showBackdrop && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeMenu}
        />
      )}
      
      {/* Mobile menu */}
      <motion.div 
        className={`fixed top-0 right-0 h-full w-64 bg-card z-30 lg:hidden transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        animate={{ x: isMenuOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <span className="font-medium">Menu</span>
          <Button variant="ghost" size="icon" onClick={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <a 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  activeItem === item.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                onClick={closeMenu}
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              Log Out
            </Button>
          </div>
        </nav>
      </motion.div>
    </>
  );
}
