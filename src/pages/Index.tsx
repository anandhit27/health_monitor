import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Activity, Users, TrendingUp, Shield, Brain, Globe } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-8 mx-auto">
            <Activity className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Smart Health
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Monitor</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Empowering healthcare workers with AI-powered risk assessment and real-time monitoring. 
            Transform patient data into actionable insights for better health outcomes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="h-12 px-8 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-lg"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="h-12 px-8 text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Intelligent Healthcare Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for ASHA workers and health officials to streamline patient monitoring and risk assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI-Powered Risk Assessment</CardTitle>
                <CardDescription>
                  Advanced machine learning algorithms analyze patient data to predict health risks in real-time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">Role-Based Access</CardTitle>
                <CardDescription>
                  Tailored interfaces for ASHA workers to submit reports and health officials to monitor populations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-xl">Real-Time Analytics</CardTitle>
                <CardDescription>
                  Comprehensive dashboards with charts, trends, and insights for data-driven healthcare decisions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <CardTitle className="text-xl">Secure & Compliant</CardTitle>
                <CardDescription>
                  Enterprise-grade security with encrypted data storage and privacy-first design principles.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-danger" />
                </div>
                <CardTitle className="text-xl">Vital Signs Monitoring</CardTitle>
                <CardDescription>
                  Comprehensive tracking of patient vitals with automated alerts for critical conditions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Multilingual Support</CardTitle>
                <CardDescription>
                  Native support for English and Hindi to serve diverse healthcare communities effectively.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of healthcare workers using Smart Health Monitor to improve patient outcomes.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/signup')}
            className="h-12 px-8 bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground text-lg"
          >
            Start Your Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            &copy; 2024 Smart Health Monitor. Empowering healthcare workers with intelligent monitoring.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
