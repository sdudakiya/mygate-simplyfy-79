import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function QRCodeScanner() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        
        // Verify QR code in database
        const { data: visitor, error } = await supabase
          .from('visitors')
          .select()
          .eq('name', parsedData.name)
          .eq('type', parsedData.type)
          .single();

        if (error || !visitor) {
          throw new Error('Invalid QR code');
        }

        toast({
          title: "Success",
          description: `Verified visitor: ${visitor.name}`,
        });
        
        setOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid QR code",
          variant: "destructive",
        });
      }
    }
  };

  const handleError = (error: Error) => {
    console.error(error);
    toast({
      title: "Error",
      description: "Failed to scan QR code",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-20">
          <QrCode className="w-6 h-6 mr-2" />
          Scan QR Code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
        </DialogHeader>
        <div className="h-[300px]">
          <Scanner
            onScan={handleScan}
            onError={handleError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}