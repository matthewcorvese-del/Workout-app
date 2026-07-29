import { Exercise, Equipment, ExerciseCategory, MuscleGroup } from '@/types/workout';

const EXERCISE_DB_BASE_URL = 'https://oss.exercisedb.dev/api/v1';

interface ExerciseDbExercise {
	exerciseId: string;
	name: string;
	gifUrl?: string;
	targetMuscles: string[];
	bodyParts: string[];
	equipments: string[];
	secondaryMuscles: string[];
	instructions?: string[];
}

interface ExerciseDbListResponse {
	success: boolean;
	metadata?: {
		nextPage?: string | null;
	};
	data: ExerciseDbExercise[];
}

interface ExerciseDbMuscleResponse {
	success: boolean;
	data: { name: string }[];
}

interface ExerciseDbSingleResponse {
	success: boolean;
	data: ExerciseDbExercise;
}

function titleCase(value: string): string {
	return value
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

function normalizeMuscleName(value: string): MuscleGroup | null {
	const normalized = value.trim().toLowerCase();

	const map: Record<string, MuscleGroup> = {
		chest: 'Chest',
		back: 'Back',
		shoulders: 'Shoulders',
		delts: 'Shoulders',
		biceps: 'Biceps',
		triceps: 'Triceps',
		forearms: 'Forearms',
		abs: 'Core',
		abdominals: 'Core',
		core: 'Core',
		quads: 'Quadriceps',
		quadriceps: 'Quadriceps',
		hamstrings: 'Hamstrings',
		glutes: 'Glutes',
		calves: 'Calves',
		'hip flexors': 'Hip Flexors',
		adductors: 'Adductors',
		abductors: 'Abductors',
		traps: 'Traps',
		trapezius: 'Traps',
		lats: 'Lats',
		'latissimus dorsi': 'Lats',
		cardio: 'Cardio',
		'cardiovascular system': 'Cardio',
		'full body': 'Full Body',
	};

	return map[normalized] ?? null;
}

function normalizeEquipment(value: string): Equipment {
	const equipment = value.trim().toLowerCase();

	if (equipment.includes('ez') && equipment.includes('bar')) return 'EZ Bar';
	if (equipment.includes('trap') && equipment.includes('bar')) return 'Trap Bar';
	if (equipment.includes('smith')) return 'Smith Machine';
	if (equipment.includes('barbell')) return 'Barbell';
	if (equipment.includes('dumbbell')) return 'Dumbbell';
	if (equipment.includes('cable')) return 'Cable';
	if (equipment.includes('kettlebell')) return 'Kettlebell';
	if (equipment.includes('band')) return 'Band';
	if (equipment.includes('suspension')) return 'Suspension';
	if (equipment.includes('medicine ball')) return 'Medicine Ball';
	if (equipment.includes('body weight') || equipment.includes('bodyweight')) return 'Bodyweight';
	if (
		equipment.includes('machine') ||
		equipment.includes('leverage') ||
		equipment.includes('assisted') ||
		equipment.includes('sled') ||
		equipment.includes('treadmill') ||
		equipment.includes('bike') ||
		equipment.includes('elliptical') ||
		equipment.includes('stepmill')
	) {
		return 'Machine';
	}
	if (equipment === 'none') return 'None';
	return 'Other';
}

function inferCategory(
	equipment: Equipment,
	bodyParts: string[],
	muscleGroups: MuscleGroup[]
): ExerciseCategory {
	const bodyPartsNormalized = bodyParts.map((part) => part.toLowerCase());

	if (bodyPartsNormalized.includes('cardio') || muscleGroups.includes('Cardio')) return 'Cardio';
	if (equipment === 'Bodyweight') return 'Bodyweight';
	if (equipment === 'Machine' || equipment === 'Cable' || equipment === 'Dumbbell' || equipment === 'Barbell' || equipment === 'Kettlebell' || equipment === 'Band') {
		return equipment;
	}
	return 'Strength';
}

function mapExerciseDbExercise(item: ExerciseDbExercise): Exercise {
	const equipments = Array.isArray(item.equipments) ? item.equipments : [];
	const targetMuscles = Array.isArray(item.targetMuscles) ? item.targetMuscles : [];
	const secondaryMuscles = Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [];
	const bodyParts = Array.isArray(item.bodyParts) ? item.bodyParts : [];
	const normalizedEquipment = equipments
		.map(normalizeEquipment)
		.find((value) => value !== 'Other') ?? normalizeEquipment(equipments[0] || 'Other');

	const muscleCandidates = [...targetMuscles, ...secondaryMuscles]
		.map(normalizeMuscleName)
		.filter((value): value is MuscleGroup => value !== null);

	const uniqueMuscles = Array.from(new Set(muscleCandidates));
	const muscleGroups: MuscleGroup[] =
		uniqueMuscles.length > 0 ? uniqueMuscles : ['Full Body'];

	return {
		id: item.exerciseId,
		name: item.name,
		equipment: normalizedEquipment,
		category: inferCategory(normalizedEquipment, bodyParts, muscleGroups),
		muscleGroups,
		gifUrl: item.gifUrl,
		instructions: item.instructions?.join('\n'),
	};
}

export async function fetchExerciseDbExercises(params?: {
	search?: string;
	muscle?: string | null;
	limit?: number;
	offset?: number;
}): Promise<Exercise[]> {
	const page = await fetchExerciseDbExercisePage(params);
	return page.exercises;
}

export async function fetchExerciseDbExercisePage(params?: {
	search?: string;
	muscle?: string | null;
	limit?: number;
	offset?: number;
}): Promise<{ exercises: Exercise[]; nextOffset: number | null }> {
	const search = (params?.search || '').trim().replace(/\s+/g, ' ');
	const muscle = params?.muscle?.trim() || '';
	const limit = Math.min(25, Math.max(1, params?.limit ?? 25));
	const offset = Math.max(0, params?.offset ?? 0);
	const searchTerms = search.toLowerCase().split(' ').filter(Boolean);
	const fallbackSearchTerm = [...searchTerms].sort((a, b) => b.length - a.length)[0] || '';

	const runRequest = async (searchValue: string): Promise<ExerciseDbListResponse> => {
		const queryParams = new URLSearchParams({
			offset: String(offset),
			limit: String(limit),
		});

		let endpoint = `${EXERCISE_DB_BASE_URL}/exercises`;

		if (searchValue || muscle) {
			endpoint = `${EXERCISE_DB_BASE_URL}/exercises/filter`;
			if (searchValue) queryParams.append('search', searchValue);
			if (muscle) queryParams.append('muscles', muscle);
			queryParams.append('sortBy', 'name');
			queryParams.append('sortOrder', 'asc');
		}

		const response = await fetch(`${endpoint}?${queryParams.toString()}`);
		if (!response.ok) {
			throw new Error(`ExerciseDB request failed (${response.status})`);
		}

		const payload = (await response.json()) as ExerciseDbListResponse;
		if (!payload.success || !Array.isArray(payload.data)) {
			throw new Error('ExerciseDB returned an invalid exercise list');
		}
		return payload;
	};

	let payload: ExerciseDbListResponse;
	let usedFallbackQuery = false;

	try {
		payload = await runRequest(search);
	} catch (error) {
		if (searchTerms.length < 2 || !fallbackSearchTerm) {
			throw error;
		}

		usedFallbackQuery = true;
		payload = await runRequest(fallbackSearchTerm);
	}

	if (searchTerms.length > 1 && payload.data.length === 0 && fallbackSearchTerm) {
		usedFallbackQuery = true;
		payload = await runRequest(fallbackSearchTerm);
	}

	let exercises = payload.data.map(mapExerciseDbExercise);

	if (usedFallbackQuery && searchTerms.length > 1) {
		exercises = exercises.filter((exercise) => {
			const normalizedName = exercise.name.toLowerCase();
			return searchTerms.every((term) => normalizedName.includes(term));
		});
	}

	let nextOffset: number | null = null;
	if (payload.metadata?.nextPage || payload.data.length === limit) {
		nextOffset = offset + limit;
	}

	return {
		exercises,
		nextOffset,
	};
}

export async function fetchExerciseDbMuscles(): Promise<string[]> {
	const response = await fetch(`${EXERCISE_DB_BASE_URL}/muscles`);
	if (!response.ok) {
		throw new Error(`ExerciseDB muscles request failed (${response.status})`);
	}

	const payload = (await response.json()) as ExerciseDbMuscleResponse;
	if (!payload.success || !Array.isArray(payload.data)) {
		throw new Error('ExerciseDB returned an invalid muscle list');
	}
	return payload.data.map((item) => titleCase(item.name));
}

export async function fetchExerciseDbExerciseById(exerciseId: string): Promise<Exercise> {
	const response = await fetch(
		`${EXERCISE_DB_BASE_URL}/exercises/${encodeURIComponent(exerciseId)}`
	);
	if (!response.ok) {
		throw new Error(`ExerciseDB by-id request failed (${response.status})`);
	}

	const payload = (await response.json()) as ExerciseDbSingleResponse;
	if (!payload.success || !payload.data) {
		throw new Error('ExerciseDB returned an invalid exercise');
	}
	return mapExerciseDbExercise(payload.data);
}
