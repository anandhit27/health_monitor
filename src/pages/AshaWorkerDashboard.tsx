import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { HealthReportForm } from "@/components/reports/health-report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string;
  role: string;
  location?: string;
}

interface ReportStats {
  totalReports: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

const AshaWorkerDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileAndStats = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.user.id)
          .single();

        if (profileError) {
          toast.error('Error loading profile');
          return;
        }

        setProfile(profileData);

        // Load report statistics
        const { data: reports, error: reportsError } = await supabase
          .from('health_reports')
          .select('risk_level')
          .eq('submitted_by', user.user.id);

        if (reportsError) {
          toast.error('Error loading statistics');
          return;
        }

        const newStats = {
          totalReports: reports.length,
          highRisk: reports.filter(r => r.risk_level === 'high').length,
          mediumRisk: reports.filter(r => r.risk_level === 'medium').length,
          lowRisk: reports.filter(r => r.risk_level === 'low').length,
        };

        setStats(newStats);
      } catch (error) {
        toast.error('Error loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileAndStats();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getRiskBadge = (level: string, count: number) => {
    const variants = {
      high: "destructive",
      medium: "warning",
      low: "success",
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || "outline"}>
        {count} {level} risk
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardHeader user={profile} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">Health reports submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground">Critical cases requiring attention</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.mediumRisk}</div>
              <p className="text-xs text-muted-foreground">Moderate risk patients</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.lowRisk}</div>
              <p className="text-xs text-muted-foreground">Stable patients</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Report Form */}
        <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-8">
            <HealthReportForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AshaWorkerDashboard;