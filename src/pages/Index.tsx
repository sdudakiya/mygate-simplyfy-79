import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VisitorCard } from "@/components/VisitorCard";
import { Visitor } from "@/types/visitor";
import { Button } from "@/components/ui/button";
import { QrCode, UserPlus, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const initialVisitors: Visitor[] = [
  {
    id: "1",
    name: "John Doe",
    type: "Guest",
    status: "pending",
    arrivalTime: "10:30 AM",
    phone: "+1234567890",
  },
  {
    id: "2",
    name: "Delivery Guy",
    type: "Delivery",
    status: "approved",
    arrivalTime: "11:45 AM",
  },
];

const Index = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    setVisitors(visitors.map(v => 
      v.id === id ? { ...v, status: "approved" as const } : v
    ));
    toast({
      title: "Visitor Approved",
      description: "The visitor has been approved for entry.",
    });
  };

  const handleDeny = (id: string) => {
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
              <Button className="flex items-center justify-center gap-2 h-20">
                <QrCode className="w-6 h-6" />
                <span>Generate QR Code</span>
              </Button>
              <Button className="flex items-center justify-center gap-2 h-20" variant="secondary">
                <UserPlus className="w-6 h-6" />
                <span>Pre-approve Visitor</span>
              </Button>
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