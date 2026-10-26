export interface Product { id: number; name: string; sku?: string; category?: string; cost: number; price: number; stock: number; supplier_id?: number; channel?: string; status: string; note?: string; }
export interface Order { id: number; order_no: string; customer_id?: number; product_id?: number; qty: number; amount: number; status: string; channel?: string; address?: string; logistics?: string; created_at?: string; }
export interface Customer { id: number; name: string; phone?: string; channel?: string; tags?: string; level?: string; note?: string; }
export interface Supplier { id: number; name: string; contact?: string; platform?: string; note?: string; }
export interface Purchase { id: number; supplier_id?: number; product_id?: number; qty: number; unit_cost: number; total: number; status: string; note?: string; }
export interface Campaign { id: number; name: string; type: string; channel?: string; product_id?: number; budget: number; status: string; start_date?: string; end_date?: string; note?: string; }
export interface Video { id: number; title: string; product_id?: number; channel?: string; stage: string; goal?: string; views: number; clicks: number; inquiries: number; orders_count: number; gmv: number; cost: number; published_at?: string; note?: string; }
export interface Aftersale { id: number; type: string; order_id?: number; customer_id?: number; product_id?: number; status: string; reason?: string; handled_by?: string; }
export interface ChatSession { id: number; customer_id?: number; channel?: string; status: string; agent?: string; unread: number; last_msg?: string; }
export interface Shop { id: number; name: string; platform: string; status: string; note?: string; }
export interface UserRow { id: number; username: string; name: string; role: string; active: number; created_at?: string; }
export interface DashboardStats { orderTotal: number; pendingShip: number; abnormal: number; lowStock: number; doneAmt: number; customers: number; tickets: number; }
export interface FinanceSummary { sales: number; cost: number; adCost: number; profit: number; refundTickets: number; byChannel: any[]; byProduct: any[]; }
