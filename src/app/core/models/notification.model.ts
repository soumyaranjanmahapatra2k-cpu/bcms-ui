export interface AppNotification {
  notificationId: string;
  notificationType: string;
  messageSubject: string;
  messageBody: string;
  readFlag: boolean;
  isActionRequired: boolean;
  actionUrl: string;
  caseId: string;
  caseReferenceNo: string;
  sentOn: string;
}
