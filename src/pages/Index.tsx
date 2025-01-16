import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VisitorCard } from "@/components/VisitorCard";
import { Button } from "@/components/ui/button";
import { UserPlus, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { PreApproveVisitorForm } from "@/components/PreApproveVisitorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Visitor } from "@/types/visitor";

const Index = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isPreApproveOpen, setIsPreApproveOpen] = useState(false);
  const { toast } = useToast();

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visitors:', error);
      return;
    }

    setVisitors(data || []);
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('visitors')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve visitor",
        variant: "destructive",
      });
      return;
    }

    setVisitors(visitors.map(v => 
      v.id === id ? { ...v, status: "approved" as const } : v
    ));
    
    toast({
      title: "Visitor Approved",
      description: "The visitor has been approved for entry.",
    });
  };

  const handleDeny = async (id: string) => {
    const { error } = await supabase
      .from('visitors')
      .update({ status: 'denied' })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to deny visitor",
        variant: "destructive",
      });
      return;
    }

    setVisitors(visitors.map(v => 
      v.id === id ? { ...v, status: "denied" as const } : v
    ));
    
    toast({
      title: "Visitor Denied",
      description: "The visitor has been denied entry.",
      variant: "destructive",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="text-gray-600 mt-1">Manage your community security</p>
              </div>
              <SidebarTrigger />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <QRCodeScanner />
              
              <Dialog open={isPreApproveOpen} onOpenChange={setIsPreApproveOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center justify-center gap-2 h-20" variant="secondary">
                    <UserPlus className="w-6 h-6" />
                    <span>Pre-approve Visitor</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pre-approve Visitor</DialogTitle>
                  </DialogHeader>
                  <PreApproveVisitorForm onSuccess={() => {
                    setIsPreApproveOpen(false);
                    fetchVisitors();
                  }} />
                </DialogContent>
              </Dialog>

              <Button className="flex items-center justify-center gap-2 h-20" variant="outline">
                <Phone className="w-6 h-6" />
                <span>Emergency Contacts</span>
              </Button>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Visitors</h2>
              {visitors.map((visitor) => (
                <VisitorCard
                  key={visitor.id}
                  visitor={visitor}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;