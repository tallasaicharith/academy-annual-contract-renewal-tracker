export const mockAuditLogs = [
  {
    id: 'a1',
    contractRenewalId: 'OX-2001',
    action: 'STATUS_CHANGE',
    fieldChanged: 'status',
    oldValue: 'Active',
    newValue: 'Expiring Soon',
    changedBy: 'System Engine',
    createdAt: '2026-06-15T08:00:00Z',
    description: 'Contract flagged as Expiring Soon (30-day window reached)'
  },
  {
    id: 'a2',
    contractRenewalId: 'OX-2001',
    action: 'NOTIFICATION_SENT',
    fieldChanged: 'alert',
    oldValue: 'None',
    newValue: 'Email Sent',
    changedBy: 'System Alert Engine',
    createdAt: '2026-06-15T08:05:00Z',
    description: 'Automated renewal alert notification email sent to Alex Rivers'
  },
  {
    id: 'a3',
    contractRenewalId: 'OX-2001',
    action: 'UPDATE',
    fieldChanged: 'priceRevision',
    oldValue: '5.0',
    newValue: '5.5',
    changedBy: 'Alex Rivers',
    createdAt: '2026-05-12T14:30:00Z',
    description: 'Price revision rate adjusted from 5.0% to 5.5% after negotiation'
  },
  {
    id: 'a4',
    contractRenewalId: 'OX-2001',
    action: 'CREATE',
    fieldChanged: 'contract',
    oldValue: 'None',
    newValue: 'Created',
    changedBy: 'Alex Rivers',
    createdAt: '2025-07-15T10:00:00Z',
    description: 'Initial contract registered on the system'
  },
  
  // Nexus Sports
  {
    id: 'a5',
    contractRenewalId: 'OX-2002',
    action: 'STATUS_CHANGE',
    fieldChanged: 'status',
    oldValue: 'Expiring Soon',
    newValue: 'Overdue',
    changedBy: 'System Engine',
    createdAt: '2026-05-10T00:00:00Z',
    description: 'Contract marked Overdue (Renewal date passed)'
  },
  {
    id: 'a6',
    contractRenewalId: 'OX-2002',
    action: 'NOTIFICATION_SENT',
    fieldChanged: 'alert',
    oldValue: 'Email Sent',
    newValue: 'Escalation Sent',
    changedBy: 'System Alert Engine',
    createdAt: '2026-05-11T09:00:00Z',
    description: 'Overdue contract alert escalation email sent to Sarah Jenkins'
  },
  {
    id: 'a7',
    contractRenewalId: 'OX-2002',
    action: 'CREATE',
    fieldChanged: 'contract',
    oldValue: 'None',
    newValue: 'Created',
    changedBy: 'Sarah Jenkins',
    createdAt: '2025-05-10T11:15:00Z',
    description: 'Initial contract registered on the system'
  },

  // Elite Athletes Club
  {
    id: 'a8',
    contractRenewalId: 'OX-2003',
    action: 'UPDATE',
    fieldChanged: 'equipmentCategories',
    oldValue: 'Athletics',
    newValue: 'Athletics, Swimming',
    changedBy: 'Marcus Thorne',
    createdAt: '2026-02-18T16:45:00Z',
    description: 'Added "Swimming" equipment supply category to the agreement'
  },
  {
    id: 'a9',
    contractRenewalId: 'OX-2003',
    action: 'CREATE',
    fieldChanged: 'contract',
    oldValue: 'None',
    newValue: 'Created',
    changedBy: 'Marcus Thorne',
    createdAt: '2025-08-20T09:30:00Z',
    description: 'Initial contract registered on the system'
  }
]
