// Fitness mode color palette — dark blue theme
const Colors = {
  // Base
  background: '#0A1628',
  surface: '#101D32',
  surfaceLight: '#162340',
  card: '#1A2840',
  cardBorder: '#243352',

  // Primary
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryMuted: '#1E3A5F',

  // Accent
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Text
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0A1628',

  // Status
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',

  // PR / records
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  // Borders & dividers
  border: '#1E2D4A',
  divider: '#1C2B44',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  modalBackground: '#0F1F3A',

  // Tab bar
  tabBarBackground: '#0D1A2D',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#4A5568',

  // Input
  inputBackground: '#162A4A',
  inputBorder: '#243B5C',

  // Workout-specific
  warmupSet: '#F39C12',
  workingSet: '#3B82F6',
  dropSet: '#9B59B6',
  failureSet: '#E74C3C',
  prIndicator: '#FFD700',

  // Progress / Charts
  progressTrack: '#1E3454',
  progressFill: '#3B82F6',

  // Muscle group colors (for exercise library)
  muscleChest: '#EF4444',
  muscleBack: '#3B82F6',
  muscleShoulders: '#8B5CF6',
  muscleBiceps: '#F59E0B',
  muscleTriceps: '#EC4899',
  muscleLegs: '#10B981',
  muscleCore: '#06B6D4',
  muscleCardio: '#F97316',
} as const;

export default Colors;
