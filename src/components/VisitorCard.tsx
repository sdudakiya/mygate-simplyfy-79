import { Check, X } from "lucide-react";
import { Visitor } from "@/types/visitor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VisitorCardProps {
  visitor: Visitor;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function VisitorCard({ visitor, onApprove, onDeny }: VisitorCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
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
      
      {visitor.status === "pending" && (
        <div className="flex gap-2 mt-4">
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
        </div>
      )}
    </Card>
  );
}