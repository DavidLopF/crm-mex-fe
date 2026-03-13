export type NotificationType = 'SALE_RETURNED';

export interface SaleReturnedMetadata {
  saleCode: string;
  returnNotes: string | null;
  cashierName: string | null;
}

export interface NotificationDto {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  readAt: string | null;
  saleId: number;
  saleCode: string;
  metadata: SaleReturnedMetadata | null;
  createdAt: string;
}

export interface NotificationListDto {
  data: NotificationDto[];
  total: number;
  unreadCount: number;
}

export interface NotificationsQueryParams {
  onlyUnread?: boolean;
  page?: number;
  limit?: number;
}
