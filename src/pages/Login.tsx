import { AuthLayout } from "@/components/ui/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

const Login = () => {
  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your Smart Health Monitor account"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;