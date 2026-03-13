import { Category } from '../types';

export const mockCategories: Category[] = [
  // IT & Technical
  { id: 'cat_1', name: 'Hardware Issue', description: 'Computers, printers, monitors, or peripheral problems.', defaultPriority: 'HIGH' },
  { id: 'cat_2', name: 'Software Bug', description: 'System crashes, errors, or unexpected behavior.', defaultPriority: 'MEDIUM' },
  { id: 'cat_3', name: 'Network / Wi-Fi Outage', description: 'Internet connectivity or speed issues.', defaultPriority: 'URGENT' },
  { id: 'cat_4', name: 'Access / Password Reset', description: 'Account logins, permissions, or MFA resets.', defaultPriority: 'LOW' },
  { id: 'cat_it_1', name: 'VPN Connectivity', description: 'Issues connecting to company systems remotely.', defaultPriority: 'MEDIUM' },
  { id: 'cat_it_2', name: 'Server Deployment', description: 'Requests for new server instances or environment updates.', defaultPriority: 'HIGH' },
  { id: 'cat_it_3', name: 'Email / Outlook Issue', description: 'Phishing attempts, sync errors, or loading problems.', defaultPriority: 'MEDIUM' },
  { id: 'cat_it_4', name: 'Database Access', description: 'SQL permissions, connection strings, or query issues.', defaultPriority: 'HIGH' },
  { id: 'cat_it_5', name: 'Cloud / AWS / Azure', description: 'Issues with hosted infrastructure or cloud services.', defaultPriority: 'HIGH' },
  { id: 'cat_it_6', name: 'Mobile Device (MDM)', description: 'Company phones, tablets, or MDM enrollment.', defaultPriority: 'LOW' },
  
  // HR & Administrative
  { id: 'cat_hr_1', name: 'Payroll Inquiry', description: 'Questions regarding salary, bonuses, or deductions.', defaultPriority: 'HIGH' },
  { id: 'cat_hr_2', name: 'Leave Application', description: 'Sick leave, vacation, or maternity/paternity requests.', defaultPriority: 'LOW' },
  { id: 'cat_hr_3', name: 'Health Insurance (HMO)', description: 'Updating dependents or claims processing.', defaultPriority: 'MEDIUM' },
  { id: 'cat_hr_4', name: 'Performance Review', description: 'Feedback, promotion requests, or goal setting.', defaultPriority: 'LOW' },
  { id: 'cat_hr_5', name: 'ID / Badge Replacement', description: 'Lost cards, name changes, or access level updates.', defaultPriority: 'LOW' },
  { id: 'cat_admin_1', name: 'Office Supplies', description: 'Paper, ink, stationery, or pantry replenishment.', defaultPriority: 'LOW' },
  
  // Finance & Accounting
  { id: 'cat_fin_1', name: 'Expense Reimbursement', description: 'Filing or tracking travel and business expenses.', defaultPriority: 'MEDIUM' },
  { id: 'cat_fin_2', name: 'Invoice / Billing', description: 'Issues with vendor payments or client billing.', defaultPriority: 'HIGH' },
  { id: 'cat_fin_3', name: 'Tax Documentation', description: 'Requests for 2316, ITR, or other tax forms.', defaultPriority: 'LOW' },
  { id: 'cat_fin_4', name: 'Budget Approval', description: 'Requests for departmental budget allocations.', defaultPriority: 'MEDIUM' },

  // Maintenance & Facilities
  { id: 'cat_maint_1', name: 'Air Conditioning (A/C)', description: 'Temperature controls, leaks, or total failure.', defaultPriority: 'HIGH' },
  { id: 'cat_maint_2', name: 'Electric / Lighting', description: 'Dim lights, power outlets, or total power failure.', defaultPriority: 'URGENT' },
  { id: 'cat_maint_3', name: 'Plumbing / Water leak', description: 'Clogged drains or water leakage in the office.', defaultPriority: 'HIGH' },
  { id: 'cat_maint_4', name: 'Janitorial Service', description: 'Cleaning requests for spills or general maintenance.', defaultPriority: 'LOW' },
  { id: 'cat_maint_5', name: 'Elevator Issue', description: 'Safety concerns or functional errors with lifts.', defaultPriority: 'URGENT' },
  { id: 'cat_maint_6', name: 'Furniture / Desk Repair', description: 'Broken chairs, shaky desks, or filing cabinet issues.', defaultPriority: 'LOW' },

  // Security & Compliance
  { id: 'cat_sec_1', name: 'Critical Security Breach', description: 'Data leak, unauthorized access, or loss of device.', defaultPriority: 'URGENT' },
  { id: 'cat_sec_2', name: 'Physical Security', description: 'Broken locks, suspicious activity, or lost ID badges.', defaultPriority: 'HIGH' },
  { id: 'cat_sec_3', name: 'Compliance Violation', description: 'Reports of unethical behavior or regulatory issues.', defaultPriority: 'HIGH' },
  { id: 'cat_sec_4', name: 'CCTV Request', description: 'Reviewing footage for security or operational reasons.', defaultPriority: 'MEDIUM' },
  
  // Marketing & Communications
  { id: 'cat_mkt_1', name: 'Brand Assets / Logo', description: 'Requests for high-res logos or brand guidelines.', defaultPriority: 'LOW' },
  { id: 'cat_mkt_2', name: 'Social Media Post', description: 'Requests for content publishing or engagement.', defaultPriority: 'LOW' },
  { id: 'cat_mkt_3', name: 'Event Management', description: 'Logistics for company seminars or townhalls.', defaultPriority: 'MEDIUM' },

  // Legal
  { id: 'cat_leg_1', name: 'Contract Review', description: 'Legal review for NDAs, SLAs, or vendor agreements.', defaultPriority: 'HIGH' },
  { id: 'cat_leg_2', name: 'Notarization', description: 'Requests for document notarization services.', defaultPriority: 'LOW' },

  // Others
  { id: 'cat_5', name: 'General Inquiry', description: 'Non-technical questions or general feedback.', defaultPriority: 'LOW' },
  { id: 'cat_misc_1', name: 'Training Request', description: 'Requests for seminars or skill upgrades.', defaultPriority: 'LOW' },
  { id: 'cat_misc_2', name: 'Transportation Support', description: 'Carpooling or company vehicle requests.', defaultPriority: 'MEDIUM' },
  { id: 'cat_misc_3', name: 'Pantry / Coffee Machine', description: 'Issues with food service or office beverages.', defaultPriority: 'LOW' }
];
