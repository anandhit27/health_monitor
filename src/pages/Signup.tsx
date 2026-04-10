import { AuthLayout } from "@/components/ui/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";

const Signup = () => {
  return (
    <AuthLayout
      title="Create Account"
      description="Join Smart Health Monitor to start making a difference"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;