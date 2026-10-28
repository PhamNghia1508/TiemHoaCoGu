export type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'Admin' | 'Staff' | 'Customer';
};

export type OrderLineItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  shippedQuantity: number;
  customNote?: string;
  referenceImageUrl?: string;
};

export type StaffOrder = {
  id: string;
  orderCode: string;
  subTotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: 'Confirmed' | 'Processing' | 'Delivering' | 'Completed' | 'Cancelled' | string;
  paymentStatus: 'Unpaid' | 'Paid' | 'PartiallyPaid' | 'Refunded' | string;
  shippingAddress: string;
  createdAt: string;
  items: OrderLineItem[];
};

export type DeliveryLine = {
  orderItemId: string;
  quantity: number;
};

export type DeliveryItem = {
  id: string;
  deliveryCode: string;
  shipperUnit?: string;
  trackingNumber?: string;
  deliveryStatus: 'Preparing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  items: DeliveryLine[];
};

export type WorkshopSession = {
  id: string;
  workshopId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  maxSlots?: number;
  bookedSlots: number;
  sessionStatus: 'Scheduled' | 'Closed' | 'Cancelled' | string;
  location: string;
};

export type WorkshopBrief = {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  durationMinutes: number;
  isActive: boolean;
};

export type RosterBooking = {
  id: string;
  sessionId: string;
  bookingCode: string;
  customerName: string;
  ticketCount: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'expired' | string;
  holdExpiresAt: string;
  checkedInAt?: string;
  createdAt: string;
};

export type CustomOrderItem = {
  id: string;
  customerId: string;
  description?: string;
  desiredBudget?: number;
  referenceImageUrl?: string;
  status: 'Draft' | 'Submitted' | 'Quoted' | 'Approved' | 'InProduction' | 'Completed' | 'Cancelled' | string;
  createdAt: string;
  productionStartedAt?: string;
  completedAt?: string;
};
