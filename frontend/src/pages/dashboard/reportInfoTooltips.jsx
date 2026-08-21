import Tooltip from '@mui/material/Tooltip'

export const NOT_REPAID_INFO =
  'Active loans that missed EDI days versus the tenure schedule (pending EMI > 0). Remaining principal can be ₹0 if tenure slots are still unpaid. On-time loans that still have remaining principal or unpaid fine appear only in Loan Outstanding & Fine.'

export const OUTSTANDING_INFO =
  'Loans with remaining principal or unpaid fine (any status). Pending till today is expected EDI rupees on working days (holidays skipped, tenure-bounded) minus principal paid, and never exceeds remaining principal. Negative shows as advance. Fine is separate and is not capped by remaining principal. Closed loans with unpaid fine appear when Status is All.'

const TOOLTIP_PROPS = {
  placement: 'top',
  arrow: true,
  enterDelay: 200,
  leaveDelay: 0,
  componentsProps: {
    tooltip: {
      sx: { maxWidth: 340, fontSize: '0.75rem', lineHeight: 1.55, fontFamily: 'Poppins, sans-serif' },
    },
  },
}

export const ReportInfoIcon = ({ title }) => (
  <Tooltip title={title} {...TOOLTIP_PROPS}>
    <span
      className="report-info-icon"
      aria-label="More info"
      onClick={(e) => e.stopPropagation()}
    >
      ⓘ
    </span>
  </Tooltip>
)
