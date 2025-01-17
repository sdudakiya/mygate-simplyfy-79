import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VisitorCard } from "@/components/VisitorCard";
import { Button } from "@/components/ui/button";
import { UserPlus, Phone, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { PreApproveVisitorForm } from "@/components/PreApproveVisitorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Visitor, VisitorType } from "@/types/visitor";
import { useNavigate, Link } from "react-router-dom";

const Index = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isPreApproveOpen, setIsPreApproveOpen] = useState(false);
  const [userRole, setUserRole] = useState<'flat_owner' | 'security' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserRole(profile.role as 'flat_owner' | 'security');
    }
  };

  const isValidVisitorType = (type: string): type is VisitorType => {
    return ['Delivery', 'Guest', 'Service', 'Cab'].includes(type);
  };

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching visitors:', error);
      return;
    }

    const transformedVisitors = (data || [])
      .map(visitor => {
        if (!isValidVisitorType(visitor.type)) {
          console.error(`Invalid visitor type: ${visitor.type}`);
          return null;
        }

        const transformedVisitor: Visitor = {
          id: visitor.id,
          name: visitor.name,
          type: visitor.type as VisitorType,
          status: visitor.status as "pending" | "approved" | "denied",
          arrivalTime: visitor.arrival_time,
        };

        if (visitor.phone) transformedVisitor.phone = visitor.phone;
        if (visitor.qr_code) transformedVisitor.qr_code = visitor.qr_code;
        if (visitor.registered_by) transformedVisitor.registered_by = visitor.registered_by;
        if (visitor.flat_id) transformedVisitor.flat_id = visitor.flat_id;

        return transformedVisitor;
      })
      .filter((visitor): visitor is Visitor => visitor !== null);

    setVisitors(transformedVisitors);
  };

  useEffect(() => {
    fetchUserRole();
    fetchVisitors();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:visitors')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'visitors' },
        () => {
          fetchVisitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <SidebarTrigger />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Visitors</h2>
                <Link to="/visitors" className="text-blue-600 hover:text-blue-800">
                  View All
                </Link>
              </div>
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
