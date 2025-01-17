import { Check, X, QrCode, Share2 } from "lucide-react";
import { Visitor } from "@/types/visitor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VisitorCardProps {
  visitor: Visitor;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function VisitorCard({ visitor, onApprove, onDeny }: VisitorCardProps) {
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFlatId, setUserFlatId] = useState<string | null>(null);
  const [registeredByFlatOwner, setRegisteredByFlatOwner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, flat_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
          setUserFlatId(profile.flat_id);
        }

        // Check if visitor was registered by a flat owner
        if (visitor.registered_by) {
          const { data: registeredByProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', visitor.registered_by)
            .single();

          setRegisteredByFlatOwner(registeredByProfile?.role === 'flat_owner');
        }
      }
    };

    fetchUserInfo();
  }, [visitor.registered_by]);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
  };

  const handleShare = async () => {
    if (!visitor.qr_code) {
      toast({
        title: "Error",
        description: "No QR code available to share",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = visitor.qr_code;
      link.download = `visitor-qr-${visitor.name}.png`;
      
      // Check if Web Share API is supported
      if (navigator.share) {
        // Create a blob from the data URL
        const response = await fetch(visitor.qr_code);
        const blob = await response.blob();
        const file = new File([blob], `visitor-qr-${visitor.name}.png`, { type: 'image/png' });

        await navigator.share({
          title: `Visitor Pass for ${visitor.name}`,
          text: `QR Code for visitor: ${visitor.name}`,
          files: [file]
        });
      } else {
        // Fallback: trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Success",
        description: "QR code shared successfully",
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the share operation
        return;
      }
      
      toast({
        title: "Error sharing",
        description: "Failed to share QR code. Please try again.",
        variant: "destructive",
      });
      console.error('Error sharing:', error);
    }
  };

  const showApprovalButtons = () => {
    if (userRole === 'security') return false;
    if (registeredByFlatOwner) return false;
    if (visitor.status !== 'pending') return false;
    return true;
  };

  return (
    <Card className="p-4 mb-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{visitor.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{visitor.type}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{visitor.arrivalTime}</span>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-sm", statusColors[visitor.status])}>
          {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        {showApprovalButtons() && (
          <>
            <Button
              onClick={() => onApprove(visitor.id)}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => onDeny(visitor.id)}
              variant="destructive"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Deny
            </Button>
          </>
        )}
        
        {visitor.qr_code && (
          <>
            <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <QrCode className="w-4 h-4 mr-2" />
                  View QR
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Visitor QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                  <img src={visitor.qr_code} alt="QR Code" className="w-64 h-64" />
                  <Button onClick={handleShare} className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </Card>
  );
}