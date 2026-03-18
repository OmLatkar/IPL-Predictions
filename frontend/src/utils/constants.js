// frontend/src/utils/constants.js

// IPL 2026 Teams
export const IPL_TEAMS = [
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

// Team colors for UI
export const TEAM_COLORS = {
  'Chennai Super Kings': 'yellow',
  'Mumbai Indians': 'blue',
  'Royal Challengers Bangalore': 'red',
  'Kolkata Knight Riders': 'purple',
  'Sunrisers Hyderabad': 'orange',
  'Delhi Capitals': 'blue',
  'Punjab Kings': 'red',
  'Rajasthan Royals': 'pink',
  'Gujarat Titans': 'blue',
  'Lucknow Super Giants': 'orange'
};

// Match status
export const MATCH_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'complete'
};

// Points configuration
export const POINTS_CONFIG = {
  LOSS_PENALTY: 10,
  DECIMAL_PLACES: 2
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'ipl_token',
  USER: 'ipl_user',
  SELECTED_GROUP: 'ipl_selected_group'
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MATCHES: '/matches',
  POINTS: '/points',
  HISTORY: '/history',
  ADMIN: '/admin',
  ADMIN_MATCHES: '/admin/matches',
  ADMIN_GROUPS: '/admin/groups',
  ADMIN_USERS: '/admin/users',
  ADMIN_TOURNAMENT: '/admin/tournament'
};

// Toast messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGIN_ERROR: 'Invalid username or password',
  REGISTER_SUCCESS: 'Registration successful!',
  REGISTER_ERROR: 'Registration failed',
  VOTE_SUCCESS: 'Vote cast successfully!',
  VOTE_ERROR: 'Failed to cast vote',
  VOTE_UPDATED: 'Vote updated successfully!',
  VOTE_CANCELLED: 'Vote cancelled',
  MATCH_CREATED: 'Match created successfully!',
  WINNER_DECLARED: 'Winner declared! Points distributed',
  GROUP_JOINED: 'Joined group successfully!',
  GROUP_LEFT: 'Left group successfully',
  TOURNAMENT_STARTED: 'Tournament started!',
  TOURNAMENT_ENDED: 'Tournament ended!'
};