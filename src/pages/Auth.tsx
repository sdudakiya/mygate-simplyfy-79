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
            Sign in to manage your community security
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flat-number">Flat Number</Label>
            <Select
              value={selectedFlatNumber}
              onValueChange={(value) => {
                setSelectedFlatNumber(value);
                // Set the flat number in the user metadata
                const element = document.querySelector('input[name="email"]');
                if (element) {
                  const event = new Event('input', { bubbles: true });
                  element.dispatchEvent(event);
                }
              }}
            >
              <SelectTrigger className="w-full">
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
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={window.location.origin}
            options={{
              emailRedirectTo: window.location.origin,
              data: {
                flat_number: selectedFlatNumber,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;