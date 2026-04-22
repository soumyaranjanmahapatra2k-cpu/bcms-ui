export interface BusinessCase {
  caseId: string;
  caseReferenceNo: string;
  title: string;
  summary: string;
  caseType: { id: string; name: string };
  requestor: { userId: string; fullName: string; email: string };
  department: { id: string; name: string };
  businessUnit: { id: string; name: string };
  category: { id: string; name: string } | null;
  categorySource: string;
  aiConfidenceScore: number | null;
  inputChannel: string;
  businessJustification: string;
  estimatedCost: number | null;
  expectedBenefit: string;
  riskAssessment: string;
  status: CaseStatus;
  currentOwnerName: string;
  currentOwnerId: string;
  versionNumber: number;
  reworkCount: number;
  priorityLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  escalationLevel?: number;
  submittedOn: string | null;
  lastActionOn: string | null;
  createdOn: string;
  createdByName: string;
  attachments: Attachment[];
  slaRemainingHours?: number;
  slaStatus?: string;
  workflowId?: string | null;
  currentStepId?: string | null;
  assignments?: CaseAssignment[];
  workflowSteps?: WorkflowStepInfo[];
}

export interface WorkflowStepInfo {
  stepId: string;
  stepName: string;
  sequenceNo: number;
  approvalType: string;
  isCurrent: boolean;
}

export interface CaseAssignment {
  assignmentId: string;
  user: { id: string; name: string } | null;
  stepId: string;
  role: string;
  decision: string | null;
  decisionOn: string | null;
}

export interface Attachment {
  attachmentId: string;
  caseId: string;
  fileName: string;
  fileUri: string;
  fileType: string;
  sourceType: string;
  uploadedByName: string;
  uploadedOn: string;
}

export interface CaseComment {
  commentId: string;
  commentText: string;
  commentType: string;
  visibilityScope: string;
  author: { userId: string; fullName: string };
  createdOn: string;
}

export interface TimelineEntry {
  entryId: string;
  actionType: string;
  actorName: string;
  fromStatus: string | null;
  toStatus: string | null;
  comment: string;
  actionOn: string;
}

export type CaseStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CLARIFICATION_REQUIRED' | 'MORE_INFO_REQUIRED' | 'REWORK_REQUIRED' | 'PENDING_APPROVAL' | 'ESCALATED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CLOSED';

export const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT: { label: 'Draft', color: 'var(--status-draft)', bg: 'var(--status-draft-bg)', icon: 'edit_note' },
  SUBMITTED: { label: 'Submitted', color: 'var(--status-submitted)', bg: 'var(--status-submitted-bg)', icon: 'send' },
  UNDER_REVIEW: { label: 'Under Review', color: 'var(--status-review)', bg: 'var(--status-review-bg)', icon: 'rate_review' },
  CLARIFICATION_REQUIRED: { label: 'Clarification Required', color: 'var(--status-clarification)', bg: 'var(--status-clarification-bg)', icon: 'help_outline' },
  MORE_INFO_REQUIRED: { label: 'More Info Required', color: 'var(--status-moreinfo)', bg: 'var(--status-moreinfo-bg)', icon: 'info' },
  REWORK_REQUIRED: { label: 'Rework Required', color: 'var(--status-rework)', bg: 'var(--status-rework-bg)', icon: 'replay' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'var(--status-pending)', bg: 'var(--status-pending-bg)', icon: 'hourglass_empty' },
  ESCALATED: { label: 'Escalated', color: 'var(--status-escalated)', bg: 'var(--status-escalated-bg)', icon: 'priority_high' },
  APPROVED: { label: 'Approved', color: 'var(--status-approved)', bg: 'var(--status-approved-bg)', icon: 'check_circle' },
  REJECTED: { label: 'Rejected', color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)', icon: 'cancel' },
  CANCELLED: { label: 'Cancelled', color: 'var(--status-cancelled)', bg: 'var(--status-cancelled-bg)', icon: 'block' },
  CLOSED: { label: 'Closed', color: 'var(--status-closed)', bg: 'var(--status-closed-bg)', icon: 'lock' },
};
