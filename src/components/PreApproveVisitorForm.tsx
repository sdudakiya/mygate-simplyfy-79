import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { QrCode } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

interface PreApproveVisitorFormProps {
  onSuccess: () => void;
}

interface FormData {
  name: string;
  type: string;
  phone: string;
}

export function PreApproveVisitorForm({ onSuccess }: PreApproveVisitorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userFlatId, setUserFlatId] = useState<string | null>(null);
  const { toast } = useToast();
  const form = useForm<FormData>();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('flat_id, role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserFlatId(profile.flat_id);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(JSON.stringify({
        name: data.name,
        type: data.type,
        timestamp: new Date().toISOString(),
      }));

      const { data: { user } } = await supabase.auth.getUser();

      // Save visitor to database
      const { error } = await supabase
        .from('visitors')
        .insert({
          name: data.name,
          type: data.type,
          phone: data.phone,
          qr_code: qrCode,
          status: 'pending',
          flat_id: userFlatId,
          registered_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Visitor has been pre-approved",
      });
      
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to pre-approve visitor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter visitor name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visitor type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Guest">Guest</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Cab">Cab</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          <QrCode className="w-4 h-4 mr-2" />
          Pre-approve & Generate QR
        </Button>
      </form>
    </Form>
  );
}