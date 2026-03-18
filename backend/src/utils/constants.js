// backend/src/utils/constants.js

// IPL 2024 Teams
const IPL_TEAMS = [
  'Chennai Super Kings',
  'Mumbai Indians',
  'Royal Challengers Bangalore',
  'Kolkata Knight Riders',
  'Sunrisers Hyderabad',
  'Delhi Capitals',
  'Punjab Kings',
  'Rajasthan Royals',
  'Gujarat Titans',
  'Lucknow Super Giants'
];

// Points configuration
const POINTS_CONFIG = {
  LOSS_PENALTY: 10,  // Points lost by each loser
  DECIMAL_PLACES: 2   // Round to 2 decimal places
};

// Match status
const MATCH_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'complete'
};

// Default admin username from env or fallback
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';

// Timezone for admin (for deadline handling)
const ADMIN_TIMEZONE = process.env.ADMIN_TIMEZONE || 'Asia/Kolkata';

// Tournament state
const TOURNAMENT_STATE = {
  ACTIVE: 'active',
  ENDED: 'ended'
};

module.exports = {
  IPL_TEAMS,
  POINTS_CONFIG,
  MATCH_STATUS,
  DEFAULT_ADMIN_USERNAME,
  ADMIN_TIMEZONE,
  TOURNAMENT_STATE
};