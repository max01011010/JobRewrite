import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthClient } from '@/utils/auth-client';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

const authClient = new AuthClient();

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    let toastId: string | number | undefined;

    const verify = async () => {
      if (!token) {
        setError("Verification token is missing.");
        showError("Verification token is missing.");
        setIsLoading(false);
        return;
      }

      try {
        toastId = showLoading("Verifying your email...");
        await authClient.verifyEmail(token);
        setIsVerified(true);
        showSuccess("Email verified successfully!");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during verification.";
        setError(errorMessage);
        showError(`Email verification failed: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        if (toastId) dismissToast(toastId);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />
        <div className="flex flex-col items-center px-6 py-5 flex-1 justify-center">
          <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-app-dark-text">Email Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-app-blue" />
                  <p className="mt-4 text-lg text-gray-600">Verifying your email...</p>
                </div>
              )}

              {!isLoading && isVerified && (
                <Alert className="bg-green-50 border-green-200 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    Your email has been successfully verified. You can now log in.
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && error && (
                <Alert variant="destructive">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && (
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-app-blue text-white hover:bg-app-blue/90"
                >
                  Back to Login
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default VerifyEmailPage;