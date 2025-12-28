import Membership from '../models/Membership.model.js';
import Loan from '../models/Loan.model.js';
import Repayment from '../models/Repayment.model.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin or Employee
export const getDashboardStats = async (req, res) => {
  try {
    // Get current date and previous month date for comparisons
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Total Members
    const totalMembers = await Membership.countDocuments({ status: 'approved' });
    const lastMonthMembers = await Membership.countDocuments({
      status: 'approved',
      createdAt: { $lt: lastMonth }
    });
    const membersTrend = lastMonthMembers > 0 
      ? ((totalMembers - lastMonthMembers) / lastMonthMembers * 100).toFixed(1)
      : 0;

    // Total Loans
    const totalLoans = await Loan.countDocuments();
    const lastMonthLoans = await Loan.countDocuments({
      createdAt: { $lt: lastMonth }
    });
    const loansTrend = lastMonthLoans > 0
      ? ((totalLoans - lastMonthLoans) / lastMonthLoans * 100).toFixed(1)
      : 0;

    // Pending Approvals (memberships + loans)
    const pendingMemberships = await Membership.countDocuments({ status: 'pending' });
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const totalPending = pendingMemberships + pendingLoans;
    
    // Pending from yesterday
    const yesterdayPending = await Membership.countDocuments({
      status: 'pending',
      createdAt: { $lt: today, $gte: yesterday }
    }) + await Loan.countDocuments({
      status: 'pending',
      createdAt: { $lt: today, $gte: yesterday }
    });
    const pendingChange = totalPending - yesterdayPending;

    // Total Disbursed (sum of all approved/active loan amounts)
    const disbursedLoans = await Loan.find({
      status: { $in: ['approved', 'active'] }
    }).select('loanAmount');
    
    const totalDisbursed = disbursedLoans.reduce((sum, loan) => {
      return sum + (loan.loanAmount || 0);
    }, 0);

    // Last month disbursed
    const lastMonthDisbursedLoans = await Loan.find({
      status: { $in: ['approved', 'active'] },
      createdAt: { $lt: lastMonth }
    }).select('loanAmount');
    
    const lastMonthDisbursed = lastMonthDisbursedLoans.reduce((sum, loan) => {
      return sum + (loan.loanAmount || 0);
    }, 0);

    const disbursedTrend = lastMonthDisbursed > 0
      ? ((totalDisbursed - lastMonthDisbursed) / lastMonthDisbursed * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalMembers: {
          value: totalMembers,
          trend: membersTrend > 0 ? 'up' : membersTrend < 0 ? 'down' : 'neutral',
          trendValue: `${Math.abs(membersTrend)}% from last month`
        },
        totalLoans: {
          value: totalLoans,
          trend: loansTrend > 0 ? 'up' : loansTrend < 0 ? 'down' : 'neutral',
          trendValue: `${Math.abs(loansTrend)}% from last month`
        },
        pendingApprovals: {
          value: totalPending,
          trend: pendingChange > 0 ? 'up' : pendingChange < 0 ? 'down' : 'neutral',
          trendValue: pendingChange > 0 
            ? `${Math.abs(pendingChange)} from yesterday`
            : pendingChange < 0
            ? `${Math.abs(pendingChange)} from yesterday`
            : 'No change'
        },
        totalDisbursed: {
          value: totalDisbursed,
          trend: disbursedTrend > 0 ? 'up' : disbursedTrend < 0 ? 'down' : 'neutral',
          trendValue: `${Math.abs(disbursedTrend)}% from last month`
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard statistics'
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private/Admin or Employee
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent memberships
    const recentMemberships = await Membership.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('userId fullName status createdAt')
      .lean();

    // Get recent loans
    const recentLoans = await Loan.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('membership', 'userId fullName')
      .select('loanAccountNumber status createdAt membership')
      .lean();

    // Combine and sort by date
    const activities = [
      ...recentMemberships.map(m => ({
        type: 'membership',
        id: m._id,
        title: `New membership application received${m.userId ? ` - ${m.userId}` : ''}`,
        description: m.fullName || 'N/A',
        status: m.status,
        createdAt: m.createdAt,
        timestamp: m.createdAt
      })),
      ...recentLoans.map(l => ({
        type: 'loan',
        id: l._id,
        title: `New loan application received${l.loanAccountNumber ? ` - ${l.loanAccountNumber}` : ''}`,
        description: l.membership?.fullName || 'N/A',
        status: l.status,
        createdAt: l.createdAt,
        timestamp: l.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        activities
      }
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching recent activity'
    });
  }
};

