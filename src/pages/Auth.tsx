
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "User authenticated" : "No session");
      setAuthenticated(!!session);
      
      if (session) {
        // When authentication succeeds, redirect to home page
        navigate("/");
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (authenticated === null) {
    return null;
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("Attempting to login with:", email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Login successful:", data);
      
      toast({
        title: "התחברת בהצלחה",
        description: "ברוכים הבאים חזרה!",
      });
      
    } catch (error) {
      console.error("Error logging in:", error);
      toast({
        title: "שגיאה בהתחברות",
        description: "אנא בדוק את הפרטים ונסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error("אנא הזן אימייל וסיסמה");
      }

      if (password.length < 6) {
        throw new Error("הסיסמה חייבת להכיל לפחות 6 תווים");
      }
      
      console.log("Attempting to sign up with:", email);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Signup response:", data);

      if (error) throw error;
      
      toast({
        title: "נרשמת בהצלחה",
        description: data.user?.identities?.length === 0 
          ? "כתובת האימייל כבר קיימת במערכת. אנא התחבר." 
          : "מיד תועבר לדף הבית",
      });
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        title: "שגיאה בהרשמה",
        description: error.message || "אנא בדוק את הפרטים ונסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-geoalert-gray p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "כניסה למערכת" : "הרשמה למערכת"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? "התחבר כדי להתחיל" : "צור חשבון חדש"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={isLogin ? handleLogin : handleSignUp}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-right">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="block text-right">סיסמה</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute left-2 top-2 h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="סיסמה (לפחות 6 תווים)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "מתחבר..." : (isLogin ? "התחברות" : "הרשמה")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? "עבור להרשמה" : "עבור להתחברות"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
