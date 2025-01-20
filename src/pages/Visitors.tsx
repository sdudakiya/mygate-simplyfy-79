import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { VisitorCard } from "@/components/VisitorCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Visitor, VisitorType } from "@/types/visitor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const Visitors = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFlatId, setUserFlatId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
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
      }
    };

    fetchUserProfile();
  }, []);

  const isValidVisitorType = (type: string): type is VisitorType => {
    return ['Delivery', 'Guest', 'Service', 'Cab'].includes(type);
  };

  const fetchVisitors = async () => {
    // First, get the total count
    let query = supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    // Apply flat_id filter for flat owners
    if (userRole === 'flat_owner' && userFlatId) {
      query = query.eq('flat_id', userFlatId);
    }

    const { count } = await query;

    // Then fetch the paginated data
    let dataQuery = supabase
      .from('visitors')
      .select(`
        *,
        flats (
          flat_number
        )
      `)
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
      .order('created_at', { ascending: false });

    // Apply flat_id filter for flat owners
    if (userRole === 'flat_owner' && userFlatId) {
      dataQuery = dataQuery.eq('flat_id', userFlatId);
    }

    const { data, error } = await dataQuery;

    if (error) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visitors",
        variant: "destructive",
      });
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
          flatNumber: visitor.flats?.flat_number || 'N/A'
        };

        if (visitor.phone) transformedVisitor.phone = visitor.phone;
        if (visitor.qr_code) transformedVisitor.qr_code = visitor.qr_code;
        if (visitor.registered_by) transformedVisitor.registered_by = visitor.registered_by;
        if (visitor.flat_id) transformedVisitor.flat_id = visitor.flat_id;

        return transformedVisitor;
      })
      .filter((visitor): visitor is Visitor => visitor !== null);

    setVisitors(transformedVisitors);
    setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
  };

  useEffect(() => {
    if (userRole) {
      fetchVisitors();
    }
  }, [currentPage, userRole, userFlatId]);

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
      <div className="min-h-screen flex flex-col md:flex-row w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-full md:max-w-6xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Visitors</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all visitor records</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Mobile view - Cards */}
              <div className="block md:hidden">
                {visitors.map((visitor) => (
                  <VisitorCard
                    key={visitor.id}
                    visitor={visitor}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                  />
                ))}
              </div>

              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Arrival Time</TableHead>
                      <TableHead>Flat Number</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map((visitor) => (
                      <TableRow key={visitor.id}>
                        <TableCell className="font-medium">{visitor.name}</TableCell>
                        <TableCell>{visitor.type}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs md:text-sm ${
                            visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                            visitor.status === 'denied' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {visitor.status.charAt(0).toUpperCase() + visitor.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(visitor.arrivalTime).toLocaleString()}
                        </TableCell>
                        <TableCell>{visitor.flatNumber}</TableCell>
                        <TableCell>
                          <VisitorCard
                            visitor={visitor}
                            onApprove={handleApprove}
                            onDeny={handleDeny}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent className="flex flex-wrap justify-center gap-2">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        aria-disabled={currentPage === 1}
                        className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''} text-sm md:text-base`}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i + 1} className="hidden md:block">
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="text-sm md:text-base"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem className="md:hidden">
                      <span className="px-4 py-2 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        aria-disabled={currentPage === totalPages}
                        className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} text-sm md:text-base`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Visitors;