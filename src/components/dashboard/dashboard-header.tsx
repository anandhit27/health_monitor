import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Activity } from "lucide-react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  user: {
    full_name: string;
    role: string;
    location?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'health_official') {
      return <Badge variant="secondary" className="bg-secondary text-secondary-foreground">Health Official</Badge>;
    }
    return <Badge variant="outline" className="border-primary text-primary">ASHA Worker</Badge>;
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Smart Health Monitor</h1>
              <p className="text-sm text-muted-foreground">Healthcare Intelligence Platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{user.full_name}</span>
              {getRoleBadge(user.role)}
            </div>
            {user.location && (
              <p className="text-sm text-muted-foreground">{user.location}</p>
            )}
          </div>
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}