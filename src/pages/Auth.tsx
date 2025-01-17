import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [selectedFlatNumber, setSelectedFlatNumber] = useState<string>("");
  const [view, setView] = useState<"sign_in" | "sign_up">("sign_in");

  // Fetch flat numbers
  const { data: flats } = useQuery({
    queryKey: ['flats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flats')
        .select('flat_number')
        .order('flat_number');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/");
      }
      if (event === 'SIGNED_OUT') {
        setError(null);
      }
    });

    // Listen for auth errors
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && !session) {
        setError("An error occurred during authentication. Please try again.");
      }
    });

    return () => {
      subscription.unsubscribe();
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to MyGate
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {view === "sign_in" ? "Sign in to manage your community security" : "Create your account"}
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          {view === "sign_up" && (
            <div className="space-y-2">
              <Label htmlFor="flat-number">Flat Number</Label>
              <Select
                value={selectedFlatNumber}
                onValueChange={setSelectedFlatNumber}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select your flat number" />
                </SelectTrigger>
                <SelectContent>
                  {flats?.map((flat) => (
                    <SelectItem key={flat.flat_number} value={flat.flat_number}>
                      {flat.flat_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1E40AF',
                    brandAccent: '#60A5FA',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
            view={view}
            onViewChange={({ view: newView }) => setView(newView as "sign_in" | "sign_up")}
            additionalData={view === "sign_up" ? {
              flat_number: selectedFlatNumber,
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;