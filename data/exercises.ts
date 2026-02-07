import { Exercise } from '@/types/workout';

const exercises: Exercise[] = [
  // ─── Chest ───
  { id: 'bench-press-bb', name: 'Barbell Bench Press', category: 'Barbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Barbell' },
  { id: 'bench-press-db', name: 'Dumbbell Bench Press', category: 'Dumbbell', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Dumbbell' },
  { id: 'incline-bench-bb', name: 'Incline Barbell Bench Press', category: 'Barbell', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], equipment: 'Barbell' },
  { id: 'incline-bench-db', name: 'Incline Dumbbell Bench Press', category: 'Dumbbell', muscleGroups: ['Chest', 'Shoulders', 'Triceps'], equipment: 'Dumbbell' },
  { id: 'decline-bench-bb', name: 'Decline Barbell Bench Press', category: 'Barbell', muscleGroups: ['Chest', 'Triceps'], equipment: 'Barbell' },
  { id: 'decline-bench-db', name: 'Decline Dumbbell Bench Press', category: 'Dumbbell', muscleGroups: ['Chest', 'Triceps'], equipment: 'Dumbbell' },
  { id: 'cable-fly', name: 'Cable Fly', category: 'Cable', muscleGroups: ['Chest'], equipment: 'Cable' },
  { id: 'db-fly', name: 'Dumbbell Fly', category: 'Dumbbell', muscleGroups: ['Chest'], equipment: 'Dumbbell' },
  { id: 'incline-db-fly', name: 'Incline Dumbbell Fly', category: 'Dumbbell', muscleGroups: ['Chest'], equipment: 'Dumbbell' },
  { id: 'pec-deck', name: 'Pec Deck Machine', category: 'Machine', muscleGroups: ['Chest'], equipment: 'Machine' },
  { id: 'chest-press-machine', name: 'Chest Press Machine', category: 'Machine', muscleGroups: ['Chest', 'Triceps'], equipment: 'Machine' },
  { id: 'push-up', name: 'Push-Up', category: 'Bodyweight', muscleGroups: ['Chest', 'Triceps', 'Core'], equipment: 'Bodyweight' },
  { id: 'dip-chest', name: 'Chest Dip', category: 'Bodyweight', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], equipment: 'Bodyweight' },
  { id: 'landmine-press', name: 'Landmine Press', category: 'Barbell', muscleGroups: ['Chest', 'Shoulders'], equipment: 'Barbell' },

  // ─── Back ───
  { id: 'deadlift', name: 'Barbell Deadlift', category: 'Barbell', muscleGroups: ['Back', 'Hamstrings', 'Glutes', 'Core'], equipment: 'Barbell' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', category: 'Barbell', muscleGroups: ['Back', 'Hamstrings', 'Glutes'], equipment: 'Barbell' },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', category: 'Barbell', muscleGroups: ['Back', 'Quadriceps', 'Glutes'], equipment: 'Trap Bar' },
  { id: 'bent-over-row-bb', name: 'Barbell Bent-Over Row', category: 'Barbell', muscleGroups: ['Back', 'Biceps'], equipment: 'Barbell' },
  { id: 'bent-over-row-db', name: 'Dumbbell Bent-Over Row', category: 'Dumbbell', muscleGroups: ['Back', 'Biceps'], equipment: 'Dumbbell' },
  { id: 'pendlay-row', name: 'Pendlay Row', category: 'Barbell', muscleGroups: ['Back', 'Biceps'], equipment: 'Barbell' },
  { id: 'pull-up', name: 'Pull-Up', category: 'Bodyweight', muscleGroups: ['Back', 'Biceps', 'Core'], equipment: 'Bodyweight' },
  { id: 'chin-up', name: 'Chin-Up', category: 'Bodyweight', muscleGroups: ['Back', 'Biceps'], equipment: 'Bodyweight' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Cable', muscleGroups: ['Back', 'Biceps'], equipment: 'Cable' },
  { id: 'cable-row', name: 'Seated Cable Row', category: 'Cable', muscleGroups: ['Back', 'Biceps'], equipment: 'Cable' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'Barbell', muscleGroups: ['Back', 'Biceps'], equipment: 'Barbell' },
  { id: 'single-arm-db-row', name: 'Single-Arm Dumbbell Row', category: 'Dumbbell', muscleGroups: ['Back', 'Biceps'], equipment: 'Dumbbell' },
  { id: 'face-pull', name: 'Face Pull', category: 'Cable', muscleGroups: ['Back', 'Shoulders'], equipment: 'Cable' },
  { id: 'straight-arm-pulldown', name: 'Straight-Arm Pulldown', category: 'Cable', muscleGroups: ['Lats', 'Back'], equipment: 'Cable' },
  { id: 'rack-pull', name: 'Rack Pull', category: 'Barbell', muscleGroups: ['Back', 'Traps', 'Glutes'], equipment: 'Barbell' },

  // ─── Shoulders ───
  { id: 'ohp-bb', name: 'Barbell Overhead Press', category: 'Barbell', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Barbell' },
  { id: 'ohp-db', name: 'Dumbbell Overhead Press', category: 'Dumbbell', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Dumbbell' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Dumbbell', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Dumbbell' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'Dumbbell', muscleGroups: ['Shoulders'], equipment: 'Dumbbell' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', category: 'Cable', muscleGroups: ['Shoulders'], equipment: 'Cable' },
  { id: 'front-raise', name: 'Front Raise', category: 'Dumbbell', muscleGroups: ['Shoulders'], equipment: 'Dumbbell' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', category: 'Dumbbell', muscleGroups: ['Shoulders', 'Back'], equipment: 'Dumbbell' },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', category: 'Machine', muscleGroups: ['Shoulders', 'Back'], equipment: 'Machine' },
  { id: 'upright-row', name: 'Upright Row', category: 'Barbell', muscleGroups: ['Shoulders', 'Traps'], equipment: 'Barbell' },
  { id: 'shrug-bb', name: 'Barbell Shrug', category: 'Barbell', muscleGroups: ['Traps'], equipment: 'Barbell' },
  { id: 'shrug-db', name: 'Dumbbell Shrug', category: 'Dumbbell', muscleGroups: ['Traps'], equipment: 'Dumbbell' },

  // ─── Biceps ───
  { id: 'barbell-curl', name: 'Barbell Curl', category: 'Barbell', muscleGroups: ['Biceps'], equipment: 'Barbell' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', category: 'Dumbbell', muscleGroups: ['Biceps'], equipment: 'Dumbbell' },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'Dumbbell', muscleGroups: ['Biceps', 'Forearms'], equipment: 'Dumbbell' },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'Barbell', muscleGroups: ['Biceps'], equipment: 'EZ Bar' },
  { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', category: 'Dumbbell', muscleGroups: ['Biceps'], equipment: 'Dumbbell' },
  { id: 'cable-curl', name: 'Cable Curl', category: 'Cable', muscleGroups: ['Biceps'], equipment: 'Cable' },
  { id: 'concentration-curl', name: 'Concentration Curl', category: 'Dumbbell', muscleGroups: ['Biceps'], equipment: 'Dumbbell' },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', category: 'Barbell', muscleGroups: ['Biceps'], equipment: 'EZ Bar' },
  { id: 'spider-curl', name: 'Spider Curl', category: 'Dumbbell', muscleGroups: ['Biceps'], equipment: 'Dumbbell' },

  // ─── Triceps ───
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', category: 'Barbell', muscleGroups: ['Triceps', 'Chest'], equipment: 'Barbell' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'Cable', muscleGroups: ['Triceps'], equipment: 'Cable' },
  { id: 'overhead-tricep-ext', name: 'Overhead Tricep Extension', category: 'Cable', muscleGroups: ['Triceps'], equipment: 'Cable' },
  { id: 'skull-crusher', name: 'Skull Crusher', category: 'Barbell', muscleGroups: ['Triceps'], equipment: 'EZ Bar' },
  { id: 'tricep-dip', name: 'Tricep Dip', category: 'Bodyweight', muscleGroups: ['Triceps', 'Chest'], equipment: 'Bodyweight' },
  { id: 'kickback', name: 'Dumbbell Kickback', category: 'Dumbbell', muscleGroups: ['Triceps'], equipment: 'Dumbbell' },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', category: 'Bodyweight', muscleGroups: ['Triceps', 'Chest'], equipment: 'Bodyweight' },

  // ─── Legs — Quads ───
  { id: 'barbell-squat', name: 'Barbell Back Squat', category: 'Barbell', muscleGroups: ['Quadriceps', 'Glutes', 'Core'], equipment: 'Barbell' },
  { id: 'front-squat', name: 'Front Squat', category: 'Barbell', muscleGroups: ['Quadriceps', 'Core'], equipment: 'Barbell' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Dumbbell', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbell' },
  { id: 'leg-press', name: 'Leg Press', category: 'Machine', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Machine' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'Machine', muscleGroups: ['Quadriceps'], equipment: 'Machine' },
  { id: 'hack-squat', name: 'Hack Squat', category: 'Machine', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Machine' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Dumbbell', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbell' },
  { id: 'walking-lunge', name: 'Walking Lunge', category: 'Dumbbell', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbell' },
  { id: 'step-up', name: 'Dumbbell Step-Up', category: 'Dumbbell', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Dumbbell' },
  { id: 'sissy-squat', name: 'Sissy Squat', category: 'Bodyweight', muscleGroups: ['Quadriceps'], equipment: 'Bodyweight' },

  // ─── Legs — Hamstrings / Glutes ───
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', category: 'Barbell', muscleGroups: ['Hamstrings', 'Glutes', 'Back'], equipment: 'Barbell' },
  { id: 'rdl-db', name: 'Dumbbell Romanian Deadlift', category: 'Dumbbell', muscleGroups: ['Hamstrings', 'Glutes'], equipment: 'Dumbbell' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', category: 'Machine', muscleGroups: ['Hamstrings'], equipment: 'Machine' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Machine', muscleGroups: ['Hamstrings'], equipment: 'Machine' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', category: 'Barbell', muscleGroups: ['Glutes', 'Hamstrings'], equipment: 'Barbell' },
  { id: 'glute-bridge', name: 'Glute Bridge', category: 'Bodyweight', muscleGroups: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight' },
  { id: 'good-morning', name: 'Good Morning', category: 'Barbell', muscleGroups: ['Hamstrings', 'Back', 'Glutes'], equipment: 'Barbell' },
  { id: 'cable-pull-through', name: 'Cable Pull-Through', category: 'Cable', muscleGroups: ['Glutes', 'Hamstrings'], equipment: 'Cable' },
  { id: 'nordic-curl', name: 'Nordic Hamstring Curl', category: 'Bodyweight', muscleGroups: ['Hamstrings'], equipment: 'Bodyweight' },

  // ─── Legs — Calves ───
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', category: 'Machine', muscleGroups: ['Calves'], equipment: 'Machine' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'Machine', muscleGroups: ['Calves'], equipment: 'Machine' },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', category: 'Machine', muscleGroups: ['Calves'], equipment: 'Machine' },

  // ─── Core ───
  { id: 'plank', name: 'Plank', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'crunch', name: 'Crunch', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'Bodyweight', muscleGroups: ['Core', 'Hip Flexors'], equipment: 'Bodyweight' },
  { id: 'cable-crunch', name: 'Cable Crunch', category: 'Cable', muscleGroups: ['Core'], equipment: 'Cable' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', category: 'Other', muscleGroups: ['Core'], equipment: 'Other' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'mountain-climber', name: 'Mountain Climber', category: 'Bodyweight', muscleGroups: ['Core', 'Cardio'], equipment: 'Bodyweight' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'pallof-press', name: 'Pallof Press', category: 'Cable', muscleGroups: ['Core'], equipment: 'Cable' },
  { id: 'side-plank', name: 'Side Plank', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },
  { id: 'decline-sit-up', name: 'Decline Sit-Up', category: 'Bodyweight', muscleGroups: ['Core'], equipment: 'Bodyweight' },

  // ─── Olympic / Compound ───
  { id: 'clean-and-jerk', name: 'Clean and Jerk', category: 'Olympic', muscleGroups: ['Full Body'], equipment: 'Barbell' },
  { id: 'snatch', name: 'Snatch', category: 'Olympic', muscleGroups: ['Full Body'], equipment: 'Barbell' },
  { id: 'power-clean', name: 'Power Clean', category: 'Olympic', muscleGroups: ['Full Body'], equipment: 'Barbell' },
  { id: 'hang-clean', name: 'Hang Clean', category: 'Olympic', muscleGroups: ['Full Body'], equipment: 'Barbell' },
  { id: 'clean-pull', name: 'Clean Pull', category: 'Olympic', muscleGroups: ['Back', 'Hamstrings', 'Traps'], equipment: 'Barbell' },
  { id: 'push-press', name: 'Push Press', category: 'Olympic', muscleGroups: ['Shoulders', 'Triceps', 'Quadriceps'], equipment: 'Barbell' },

  // ─── Kettlebell ───
  { id: 'kb-swing', name: 'Kettlebell Swing', category: 'Kettlebell', muscleGroups: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Kettlebell' },
  { id: 'kb-goblet-squat', name: 'Kettlebell Goblet Squat', category: 'Kettlebell', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Kettlebell' },
  { id: 'kb-snatch', name: 'Kettlebell Snatch', category: 'Kettlebell', muscleGroups: ['Full Body'], equipment: 'Kettlebell' },
  { id: 'kb-clean-press', name: 'Kettlebell Clean and Press', category: 'Kettlebell', muscleGroups: ['Shoulders', 'Full Body'], equipment: 'Kettlebell' },
  { id: 'kb-turkish-getup', name: 'Turkish Get-Up', category: 'Kettlebell', muscleGroups: ['Full Body', 'Core'], equipment: 'Kettlebell' },
  { id: 'kb-windmill', name: 'Kettlebell Windmill', category: 'Kettlebell', muscleGroups: ['Core', 'Shoulders'], equipment: 'Kettlebell' },

  // ─── Cardio ───
  { id: 'treadmill-run', name: 'Treadmill Run', category: 'Cardio', muscleGroups: ['Cardio'], equipment: 'Machine' },
  { id: 'stationary-bike', name: 'Stationary Bike', category: 'Cardio', muscleGroups: ['Cardio', 'Quadriceps'], equipment: 'Machine' },
  { id: 'rowing-machine', name: 'Rowing Machine', category: 'Cardio', muscleGroups: ['Cardio', 'Back', 'Core'], equipment: 'Machine' },
  { id: 'elliptical', name: 'Elliptical', category: 'Cardio', muscleGroups: ['Cardio', 'Full Body'], equipment: 'Machine' },
  { id: 'stair-climber', name: 'Stair Climber', category: 'Cardio', muscleGroups: ['Cardio', 'Quadriceps', 'Glutes'], equipment: 'Machine' },
  { id: 'jump-rope', name: 'Jump Rope', category: 'Cardio', muscleGroups: ['Cardio', 'Calves'], equipment: 'Other' },
  { id: 'burpee', name: 'Burpee', category: 'Cardio', muscleGroups: ['Full Body', 'Cardio'], equipment: 'Bodyweight' },
  { id: 'box-jump', name: 'Box Jump', category: 'Cardio', muscleGroups: ['Quadriceps', 'Glutes', 'Cardio'], equipment: 'Other' },
  { id: 'battle-ropes', name: 'Battle Ropes', category: 'Cardio', muscleGroups: ['Cardio', 'Shoulders', 'Core'], equipment: 'Other' },
  { id: 'sled-push', name: 'Sled Push', category: 'Cardio', muscleGroups: ['Quadriceps', 'Glutes', 'Cardio'], equipment: 'Other' },
  { id: 'swimming', name: 'Swimming', category: 'Cardio', muscleGroups: ['Cardio', 'Full Body'], equipment: 'None' },
  { id: 'outdoor-run', name: 'Outdoor Run', category: 'Cardio', muscleGroups: ['Cardio'], equipment: 'None' },
  { id: 'outdoor-walk', name: 'Outdoor Walk', category: 'Cardio', muscleGroups: ['Cardio'], equipment: 'None' },

  // ─── Flexibility / Mobility ───
  { id: 'foam-roll', name: 'Foam Rolling', category: 'Flexibility', muscleGroups: ['Full Body'], equipment: 'Other' },
  { id: 'yoga-flow', name: 'Yoga Flow', category: 'Flexibility', muscleGroups: ['Full Body'], equipment: 'None' },
  { id: 'hip-stretch', name: 'Hip Flexor Stretch', category: 'Flexibility', muscleGroups: ['Hip Flexors'], equipment: 'None' },
  { id: 'hamstring-stretch', name: 'Hamstring Stretch', category: 'Flexibility', muscleGroups: ['Hamstrings'], equipment: 'None' },

  // ─── Forearms ───
  { id: 'wrist-curl', name: 'Wrist Curl', category: 'Dumbbell', muscleGroups: ['Forearms'], equipment: 'Dumbbell' },
  { id: 'reverse-wrist-curl', name: 'Reverse Wrist Curl', category: 'Dumbbell', muscleGroups: ['Forearms'], equipment: 'Dumbbell' },
  { id: 'farmers-walk', name: "Farmer's Walk", category: 'Strength', muscleGroups: ['Forearms', 'Traps', 'Core'], equipment: 'Dumbbell' },

  // ─── Band / Suspension ───
  { id: 'band-pull-apart', name: 'Band Pull-Apart', category: 'Band', muscleGroups: ['Shoulders', 'Back'], equipment: 'Band' },
  { id: 'band-face-pull', name: 'Band Face Pull', category: 'Band', muscleGroups: ['Shoulders', 'Back'], equipment: 'Band' },
  { id: 'trx-row', name: 'TRX Row', category: 'Bodyweight', muscleGroups: ['Back', 'Biceps'], equipment: 'Suspension' },
  { id: 'trx-push-up', name: 'TRX Push-Up', category: 'Bodyweight', muscleGroups: ['Chest', 'Core'], equipment: 'Suspension' },

  // ─── Smith Machine ───
  { id: 'smith-squat', name: 'Smith Machine Squat', category: 'Machine', muscleGroups: ['Quadriceps', 'Glutes'], equipment: 'Smith Machine' },
  { id: 'smith-bench-press', name: 'Smith Machine Bench Press', category: 'Machine', muscleGroups: ['Chest', 'Triceps'], equipment: 'Smith Machine' },
  { id: 'smith-ohp', name: 'Smith Machine Overhead Press', category: 'Machine', muscleGroups: ['Shoulders', 'Triceps'], equipment: 'Smith Machine' },
];

export default exercises;

// Helper functions
export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return exercises.filter((e) =>
    e.muscleGroups.some((mg) => mg.toLowerCase() === muscleGroup.toLowerCase())
  );
}

export function getExercisesByCategory(category: string): Exercise[] {
  return exercises.filter(
    (e) => e.category.toLowerCase() === category.toLowerCase()
  );
}

export function getExercisesByEquipment(equipment: string): Exercise[] {
  return exercises.filter(
    (e) => e.equipment.toLowerCase() === equipment.toLowerCase()
  );
}

export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(lowerQuery) ||
      e.category.toLowerCase().includes(lowerQuery) ||
      e.muscleGroups.some((mg) => mg.toLowerCase().includes(lowerQuery)) ||
      e.equipment.toLowerCase().includes(lowerQuery)
  );
}

export function getAllMuscleGroups(): string[] {
  const groups = new Set<string>();
  exercises.forEach((e) => e.muscleGroups.forEach((mg) => groups.add(mg)));
  return Array.from(groups).sort();
}

export function getAllCategories(): string[] {
  const categories = new Set<string>();
  exercises.forEach((e) => categories.add(e.category));
  return Array.from(categories).sort();
}

export function getAllEquipment(): string[] {
  const equipment = new Set<string>();
  exercises.forEach((e) => equipment.add(e.equipment));
  return Array.from(equipment).sort();
}
