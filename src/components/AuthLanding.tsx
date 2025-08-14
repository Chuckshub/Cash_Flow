"use client";

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Divider,
  Link
} from '@heroui/react';
import { Eye, EyeOff, Mail, Lock, User, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface AuthLandingProps {
  onAuthSuccess?: () => void;
}

export default function AuthLanding({ onAuthSuccess }: AuthLandingProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      onAuthSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-50/30 to-success-50/30 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl animate-bounce-subtle" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-success-200/30 rounded-full blur-3xl animate-bounce-subtle" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left space-y-6"
        >
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
                CashFlow Pro
              </h1>
              <p className="text-sm text-default-500">Smart Financial Analytics</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-success-500 bg-clip-text text-transparent">
                Transform
              </span>
              <br />
              <span className="text-foreground">Your Financial Data</span>
            </h2>
            
            <p className="text-lg text-default-600 leading-relaxed max-w-md">
              Upload your bank CSV data and get instant, actionable insights with our 
              AI-powered analytics platform.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {[
              "📊 Weekly cash flow analysis",
              "🔒 Secure data processing",
              "📈 Smart financial insights",
              "💾 Cloud data storage"
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3 text-default-600"
              >
                <span className="text-lg">{feature.split(' ')[0]}</span>
                <span>{feature.substring(feature.indexOf(' ') + 1)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <Card className="w-full max-w-md shadow-2xl border border-divider">
            <CardHeader className="text-center pb-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h3>
                <p className="text-default-500">
                  {isSignUp 
                    ? 'Start analyzing your financial data today' 
                    : 'Sign in to access your dashboard'
                  }
                </p>
              </div>
            </CardHeader>
            
            <CardBody className="space-y-6">
              {/* Google Sign In */}
              <Button
                variant="bordered"
                size="lg"
                className="w-full"
                startContent={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
                onClick={handleGoogleSignIn}
                isLoading={isLoading}
              >
                Continue with Google
              </Button>

              <div className="flex items-center gap-4">
                <Divider className="flex-1" />
                <span className="text-default-400 text-sm">or</span>
                <Divider className="flex-1" />
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    startContent={<User className="h-4 w-4 text-default-400" />}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    isRequired
                  />
                )}
                
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  startContent={<Mail className="h-4 w-4 text-default-400" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isRequired
                />
                
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  startContent={<Lock className="h-4 w-4 text-default-400" />}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4 text-default-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-default-400" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  isRequired
                />

                {error && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full font-semibold"
                  isLoading={isLoading}
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              {/* Toggle Sign Up/In */}
              <div className="text-center">
                <p className="text-default-500">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  {' '}
                  <Link
                    className="text-primary cursor-pointer font-medium"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                      setEmail('');
                      setPassword('');
                      setDisplayName('');
                    }}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}