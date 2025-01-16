import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IDetectedBarcode {
  rawValue: string;
}

export function QRCodeScanner() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    const data = detectedCodes[0]?.rawValue;
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        
        // Verify QR code in database
        const { data: visitor, error: fetchError } = await supabase
          .from('visitors')
          .select()
          .eq('name', parsedData.name)
          .eq('type', parsedData.type)
          .single();

        if (fetchError || !visitor) {
          throw new Error('Invalid QR code');
        }

        // Update visitor status to approved
        const { error: updateError } = await supabase
          .from('visitors')
          .update({ status: 'approved' })
          .eq('id', visitor.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Success",
          description: `Verified and approved visitor: ${visitor.name}`,
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