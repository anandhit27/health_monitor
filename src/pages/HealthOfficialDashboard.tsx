import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, TrendingUp, Users, AlertTriangle, Download, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  full_name: string;
  role: string;
  location?: string;
}

interface HealthReport {
  id: string;
  patient_name: string;
  patient_age: number;
  patient_location: string;
  risk_level: string;
  symptoms: string[];
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface DashboardStats {
  totalReports: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  todayReports: number;
}

const HealthOfficialDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    todayReports: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
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

        // Load all health reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('health_reports')
          .select(`
            id,
            patient_name,
            patient_age,
            patient_location,
            risk_level,
            symptoms,
            created_at,
            submitted_by
          `)
          .order('created_at', { ascending: false });

        if (reportsError) {
          toast.error('Error loading reports');
          return;
        }

        // Get unique submitter IDs
        const submitterIds = [...new Set(reportsData?.map(r => r.submitted_by) || [])];
        
        // Load profiles for all submitters
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', submitterIds);

        if (profilesError) {
          toast.error('Error loading profiles');
          return;
        }

        // Create a map of user_id to profile
        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        // Combine reports with profile data
        const reportsWithProfiles = reportsData?.map(report => ({
          ...report,
          profiles: profileMap.get(report.submitted_by) || null
        })) || [];

        setReports(reportsWithProfiles);

        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newStats = {
          totalReports: reportsData?.length || 0,
          highRisk: reportsData?.filter(r => r.risk_level === 'high').length || 0,
          mediumRisk: reportsData?.filter(r => r.risk_level === 'medium').length || 0,
          lowRisk: reportsData?.filter(r => r.risk_level === 'low').length || 0,
          todayReports: reportsData?.filter(r => new Date(r.created_at) >= today).length || 0,
        };

        setStats(newStats);
      } catch (error) {
        toast.error('Error loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patient_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === "all" || report.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (level: string) => {
    const variants = {
      high: { className: "bg-danger text-danger-foreground", label: "High Risk" },
      medium: { className: "bg-warning text-warning-foreground", label: "Medium Risk" },
      low: { className: "bg-success text-success-foreground", label: "Low Risk" },
      pending: { className: "bg-muted text-muted-foreground", label: "Pending" },
    };

    const variant = variants[level as keyof typeof variants] || variants.pending;
    
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  // Prepare data for charts
  const riskDistributionData = [
    { name: 'Low Risk', value: stats.lowRisk, color: 'hsl(var(--success))' },
    { name: 'Medium Risk', value: stats.mediumRisk, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: stats.highRisk, color: 'hsl(var(--danger))' },
  ];

  const dailyReportsData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayReports = reports.filter(r => {
      const reportDate = new Date(r.created_at);
      return reportDate.toDateString() === date.toDateString();
    });
    return {
      name: format(date, 'EEE'),
      value: dayReports.length,
    };
  });

  const locationHotspots = reports.reduce((acc, report) => {
    acc[report.patient_location] = (acc[report.patient_location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hotspotData = Object.entries(locationHotspots)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const exportToCSV = () => {
    const headers = ['Patient Name', 'Age', 'Location', 'Risk Level', 'Symptoms', 'Submitted By', 'Date'];
    const csvData = filteredReports.map(report => [
      report.patient_name,
      report.patient_age,
      report.patient_location,
      report.risk_level,
      report.symptoms.join('; '),
      report.profiles?.full_name || 'Unknown',
      format(new Date(report.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_reports_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Report exported successfully');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <DashboardHeader user={profile} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">All submitted reports</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Reports</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.todayReports}</div>
              <p className="text-xs text-muted-foreground">New reports today</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">{stats.highRisk}</div>
              <p className="text-xs text-muted-foreground">Critical cases</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.mediumRisk}</div>
              <p className="text-xs text-muted-foreground">Moderate cases</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.lowRisk}</div>
              <p className="text-xs text-muted-foreground">Stable cases</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnalyticsChart
            title="Risk Distribution"
            description="Breakdown of cases by risk level"
            data={riskDistributionData}
            type="pie"
            colors={['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--danger))']}
          />
          
          <AnalyticsChart
            title="Daily Reports"
            description="Reports submitted over the last 7 days"
            data={dailyReportsData}
            type="line"
          />
          
          <AnalyticsChart
            title="Location Hotspots"
            description="Top 5 locations with most reports"
            data={hotspotData}
            type="bar"
          />
        </div>

        {/* Reports Table */}
        <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-foreground">Health Reports</CardTitle>
                <CardDescription>All submitted patient health reports</CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.patient_name}</TableCell>
                    <TableCell>{report.patient_age}</TableCell>
                    <TableCell>{report.patient_location}</TableCell>
                    <TableCell>{getRiskBadge(report.risk_level)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={report.symptoms.join(', ')}>
                        {report.symptoms.slice(0, 2).join(', ')}
                        {report.symptoms.length > 2 && '...'}
                      </div>
                    </TableCell>
                    <TableCell>{report.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>{format(new Date(report.created_at), 'MMM dd, HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No reports found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HealthOfficialDashboard;