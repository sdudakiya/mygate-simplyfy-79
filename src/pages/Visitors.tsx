import { useState, useEffect } from "react";
import { VisitorCard } from "@/components/VisitorCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Visitor } from "@/types/visitor";

const Visitors = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const { toast } = useToast();

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visitors",
        variant: "destructive",
      });
      return;
    }

    const transformedVisitors = data.map(visitor => ({
      id: visitor.id,
      name: visitor.name,
      type: visitor.type,
      status: visitor.status,
      arrivalTime: visitor.arrival_time,
      phone: visitor.phone,
      qr_code: visitor.qr_code,
      registered_by: visitor.registered_by,
      flat_id: visitor.flat_id
    }));

    setVisitors(transformedVisitors);
  };

  useEffect(() => {
    fetchVisitors();

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

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Visitors</h1>
        <div>
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
    </div>
  );
};

export default Visitors;