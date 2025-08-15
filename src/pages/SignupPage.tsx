import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import AppFooter from '@/components/AppFooter';
import UnderConstructionBanner from '@/components/UnderConstructionBanner'; // Import the banner

const signupSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }),
  last_name: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormInputs) => {
    try {
      await signup(data.email, data.first_name, data.last_name, data.password);
      navigate('/login'); // Redirect to login page after successful signup
    } catch (error) {
      // Error handled by useAuth hook's showError
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        {/* AppHeader removed from here as it's now global */}
        <UnderConstructionBanner /> {/* Banner added here */}
        <div className="flex flex-col items-center px-6 py-5 flex-1 justify-center">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-app-dark-text">Sign Up</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  {...register("first_name")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  {...register("last_name")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                  className="mt-1"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-app-blue text-white hover:bg-app-blue/90"
                disabled={true} {/* Temporarily disabled */}
              >
                Sign Up (Temporarily Disabled)
              </Button>
            </form>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-app-blue hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default SignupPage;