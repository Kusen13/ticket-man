import { KBArticle } from '../types';

export const mockKnowledgeBase: KBArticle[] = [
  {
    id: 'kb_1',
    title: 'How to Connect to Employee VPN (Official Guide)',
    content: 'If you are working remotely, you must use the VPN to access company tools.\n\n### ⚡ Quick Steps:\n1. **Open Application**: Search for "Cisco AnyConnect" on your laptop.\n2. **Type Server**: Enter `vpn.fastservices.corp` in the address field.\n3. **Login**: Use your employee ID (e.g., FS-XXXX) and Windows password.\n4. **MFA**: Approve the notification on your mobile Duo app.\n\n*Note: If connection fails, restart your router and try again.*',
    category: 'Network Access',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=R23I4RNR2j8'
  },
  {
    id: 'kb_2',
    title: 'Filing for PTO or Sick Leave',
    content: 'All leave requests must be filed through the HR Portal.\n\n### 🗓️ Guidelines:\n- **Sick Leave**: File as soon as possible. A medical certificate is required for more than 2 days.\n- **PTO**: Must be submitted at least **2 weeks** in advance.\n\n### 🚀 How to File:\n1. Log in to the **HRIS Portal**.\n2. Go to "Time Off" > "Request Leave".\n3. Select your dates and leave type.\n4. Click "Submit" to notify your manager.',
    category: 'Leaves & Absences',
    departmentId: 'dept_2',
    createdBy: 'usr_3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=uPhN1d2rU3E'
  },
  {
    id: 'kb_3',
    title: 'Self-Service Password Reset (SSPR)',
    content: 'You can reset your own password without calling IT if you have registered your phone number.\n\n### 🔑 Instructions:\n1. Go to the [Login Page].\n2. Click "Forgot Password" or "Can\'t access account?".\n3. Enter your full FS email address.\n4. Choose "Text my Phone" for the verification code.\n5. Type the 6-digit code and set your new password.',
    category: 'Account Help',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=N_p39Yl1Bxs'
  },
  {
    id: 'kb_4',
    title: 'Printer Troubleshooting (Paper Jams & Offline)',
    content: 'Before filing a ticket for a printer, try these quick fixes.\n\n### 🖨️ Basic Troubleshooting:\n1. **Offline Status**: Unplug the power cord for 30 seconds and plug it back in.\n2. **Paper Jam**: Open all trays and the back cover. Gently pull any visible paper with both hands.\n3. **Missing Printout**: Check the "Print Queue" on your PC and cancel any "Error" items.\n\n*Still not working? File a ticket under "Hardware Support".*',
    category: 'Hardware',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=2-nF76e5B2k'
  },
  {
    id: 'kb_5',
    title: 'Microsoft Teams & Outlook Sync Issues',
    content: 'Common issues with calendar sync or missing messages can usually be fixed by clearing the cache.\n\n### 🛠️ How to Fix:\n1. **Close Teams** completely (check system tray).\n2. Press `Win + R`, type `%appdata%\\Microsoft\\Teams` and press Enter.\n3. Delete everything inside the folder.\n4. Restart Teams. Your calendar should now be in sync with Outlook.',
    category: 'Software',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=41fO-dD50R0'
  },
  {
    id: 'kb_6',
    title: 'Setting up Outlook Signature',
    content: 'Follow the corporate standard for your email signature.\n\n### ✉️ Steps:\n1. Get the signature template from the Internal Branding site.\n2. Open Outlook > File > Options > Mail.\n3. Click "Signatures" and paste the template.\n4. Update with your Name, Position, and Phone Number.',
    category: 'Software',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=I0YJt6-v03g'
  },
  {
    id: 'kb_7',
    title: 'HMO Enrollment & Claims Guide',
    content: 'Managing your medical insurance benefits.\n\n### 🏥 Enrollment:\n1. New hires are automatically enrolled in Maxicare.\n2. Check your registered email for the e-card.\n\n### 📝 Reimbursements:\n1. Scan all receipts and medical abstracts.\n2. Log in to the Maxicare Portal.\n3. Upload documents under "New Claim".',
    category: 'Benefits',
    departmentId: 'dept_2',
    createdBy: 'usr_3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=Xq-K9l30vS0'
  },
  {
    id: 'kb_8',
    title: 'Clearing Browser Cache & Cookies',
    content: 'Fix most website errors and slow loading times.\n\n### 🌐 Google Chrome:\n1. Press `Ctrl + Shift + Del`.\n2. Set Time Range to "All Time".\n3. Check "Cookies" and "Cached images".\n4. Click "Clear data".',
    category: 'Account Help',
    departmentId: 'dept_1',
    createdBy: 'usr_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=5U2-N9DAs-w'
  },
  {
    id: 'kb_9',
    title: 'Payroll Schedule & Payslip Portal',
    content: 'Information regarding salary disbursement.\n\n### 💰 Schedule:\n- **15th**: Covering 26th of previous month to 10th of current month.\n- **30th/End of Month**: Covering 11th to 25th.\n\n### 📑 Accessing Payslip:\n1. Log in to **FastPay Portal**.\n2. Go to "My Documents" > "Payslips".',
    category: 'Payroll',
    departmentId: 'dept_2',
    createdBy: 'usr_3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=SAn_W0DskO4'
  },
  {
    id: 'kb_10',
    title: 'Internal Requisition for Office Supplies',
    content: 'How to request pens, paper, and other office essentials.\n\n### 🖊️ Procedure:\n1. Check the existing stock in your floor pantry first.\n2. If not available, fill out the "Store Requisition Form" (SRF).\n3. Get approval from your immediate supervisor.\n4. Submit the SRF to the General Services Department (GSD).',
    category: 'Facilities',
    departmentId: 'dept_4',
    createdBy: 'usr_4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoUrl: 'https://www.youtube.com/watch?v=C2_d5JvW_Xo'
  }
];
