export type VisitorType = "Delivery" | "Guest" | "Service" | "Cab";

export interface Visitor {
  id: string;
  name: string;
  type: VisitorType;
  status: "pending" | "approved" | "denied";
  arrivalTime: string;
  phone?: string;
  qr_code?: string;
}