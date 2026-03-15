import React, { useState } from 'react';
import { Sparkles, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface AutoSolutionCardProps {
  category: string;
  onResolve?: () => void;
}

const SOLUTIONS: Record<string, string> = {
  'Network Access': `### Quick Fix Steps:
1. **Reset MFA Session**: Log out and log back in to refresh your authentication token
2. **Restart Cisco AnyConnect**: Close the client completely and reopen it
3. **Check Wi-Fi**: Ensure you're on a stable network before connecting
4. **Try Alternate VPN**: If issues persist, try the backup VPN server

> If none of these work, submit a ticket and we'll investigate.`,
  'Software': `### Quick Fix Steps:
1. **Clear Cache**: 
   - Teams: File > Settings > Clear Cache
   - Outlook: Close Outlook, delete %localappdata%\\Microsoft\\Outlook\\RoamCache
2. **Restart the Application**: Close completely and reopen
3. **Check for Updates**: Ensure you're running the latest version
4. **Reboot Your PC**: Sometimes a restart is the best fix

> Still having issues? Let us know in the ticket.`,
  'Hardware': `### Quick Fix Steps:
1. **Check Physical Connections**: Ensure all cables are securely connected
2. **Power Cycle**: Turn off the device, wait 30 seconds, turn back on
3. **Re-add Printer**:
   - Go to Settings > Devices > Printers
   - Remove the printer, click "Add a printer"
   - Search for the printer again
4. **Check Status**: Ensure the device shows as "Online"

> Physical damage? Submit a ticket immediately.`,
  'Account Help': `### Quick Fix Steps:
1. **Wait 15 Minutes**: Password lockouts are temporary for security
2. **Use SSPR**: If enabled, use Self-Service Password Reset
3. **Check Email**: Look for account notification emails
4. **Contact IT**: If still locked out, submit a ticket

> Never share your password with anyone!`,
  'Leaves & Absences': `### Quick Fix Steps:
1. **Upload Documents**: Ensure all supporting documents are attached
2. **Check HR Portal**: Verify your request status online
3. **Required Documents**:
   - Medical: Doctor's certificate
   - Vacation: Approval email
   - Emergency: Incident report
4. **Processing Days**: Allow 2-3 business days

> Questions about policy? Check the HR Handbook.`,
  'Benefits': `### Quick Fix Steps:
1. **Check Email**: Maxicare digital copies are sent via email
2. **Portal Status**: Check the benefits portal for enrollment status
3. **Processing Days**: Tuesdays and Thursdays are processing days
4. **Required Info**: Ensure all fields are complete

> Claims questions? Contact Maxicare directly.`,
  'Payroll': `### Quick Fix Steps:
1. **Payslip Release**: Released 2 days before disbursement
2. **Check FastPay Portal**: View detailed breakdown there
3. **Direct Deposit**: Check your bank for processing
4. **Discrepancies**: Report immediately via FastPay Portal

> Payroll runs on the 15th and 30th of each month.`,
};

export const AutoSolutionCard: React.FC<AutoSolutionCardProps> = ({ category, onResolve }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isResolved, setIsResolved] = useState<boolean | null>(null);
  const solution = SOLUTIONS[category] || `### Need Help with ${category}?

Our team is here to help! 

**Steps to resolve:**
1. Check the Knowledge Base for detailed guides
2. Try the quick fixes listed above
3. If still unresolved, submit a support ticket

We'll get back to you within 24 hours.`;

  const handleResolved = (resolved: boolean) => {
    setIsResolved(resolved);
    if (resolved && onResolve) {
      onResolve();
    }
  };

  return (
    <div className="glass-card border-violet-500/20 overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-violet-500/10 to-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">AI Solution: {category}</h4>
            <p className="text-xs text-slate-400">Generated based on common issues</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">
            {solution.split('\n').map((line, i) => {
              if (line.startsWith('###')) return <h5 key={i} className="text-white font-bold mt-4 mb-2">{line.replace('### ', '')}</h5>;
              if (line.startsWith('>')) return <p key={i} className="text-violet-300 italic text-xs mt-2">{line.replace('> ', '')}</p>;
              if (line.startsWith('**')) return <p key={i} className="font-bold text-white mt-3">{line.replace(/\*\*/g, '')}</p>;
              if (line.match(/^\d+\./)) return <p key={i} className="text-slate-400 ml-2">{line}</p>;
              return <p key={i} className="text-slate-400">{line}</p>;
            })}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <span className="text-xs text-slate-500">Did this help?</span>
            <button
              onClick={() => handleResolved(true)}
              className={clsx(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                isResolved === true 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-white/5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400"
              )}
            >
              <CheckCircle size={12} /> Yes, resolved
            </button>
            <button
              onClick={() => handleResolved(false)}
              className={clsx(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                isResolved === false 
                  ? "bg-rose-500/20 text-rose-400" 
                  : "bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
              )}
            >
              <XCircle size={12} /> No, still need help
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSolutionCard;
