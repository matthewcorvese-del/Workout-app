import { useCallback, useEffect, useState } from 'react';
import { UserProfile } from '@/contexts/SettingsContext';
import { HeightUnit, WeightUnit } from '@/types/workout';

interface UseProfileMeasurementInputsParams {
  profile: UserProfile;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  updateProfile: (update: Partial<UserProfile>) => void;
}

interface UseProfileMeasurementInputsResult {
  weightInput: string;
  setWeightInput: (value: string) => void;
  heightCmInput: string;
  setHeightCmInput: (value: string) => void;
  heightFtInput: string;
  setHeightFtInput: (value: string) => void;
  heightInInput: string;
  setHeightInInput: (value: string) => void;
  commitWeightInput: () => void;
  commitMetricHeightInput: () => void;
  commitImperialHeightInput: () => void;
}

const KG_TO_LBS = 2.2046226218;
const CM_TO_IN = 0.3937007874;

export function useProfileMeasurementInputs({
  profile,
  weightUnit,
  heightUnit,
  updateProfile,
}: UseProfileMeasurementInputsParams): UseProfileMeasurementInputsResult {
  const [weightInput, setWeightInput] = useState('');
  const [heightCmInput, setHeightCmInput] = useState('');
  const [heightFtInput, setHeightFtInput] = useState('');
  const [heightInInput, setHeightInInput] = useState('');

  useEffect(() => {
    if (profile.weightKg <= 0) {
      setWeightInput('');
      return;
    }

    const displayValue = weightUnit === 'lbs' ? profile.weightKg * KG_TO_LBS : profile.weightKg;
    setWeightInput(displayValue.toFixed(1));
  }, [profile.weightKg, weightUnit]);

  useEffect(() => {
    if (heightUnit === 'metric') {
      setHeightCmInput(profile.heightCm > 0 ? String(profile.heightCm) : '');
      return;
    }

    const totalInches = Math.round(profile.heightCm * CM_TO_IN);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    setHeightFtInput(feet > 0 ? String(feet) : '');
    setHeightInInput(String(inches));
  }, [heightUnit, profile.heightCm]);

  const commitWeightInput = useCallback(() => {
    const raw = weightInput.trim();
    if (raw === '') {
      updateProfile({ weightKg: 0 });
      return;
    }

    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;

    updateProfile({
      weightKg: weightUnit === 'lbs' ? parsed / KG_TO_LBS : parsed,
    });
  }, [updateProfile, weightInput, weightUnit]);

  const commitMetricHeightInput = useCallback(() => {
    const raw = heightCmInput.trim();
    if (raw === '') {
      updateProfile({ heightCm: 0 });
      return;
    }

    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;

    updateProfile({ heightCm: Math.max(0, parsed) });
  }, [heightCmInput, updateProfile]);

  const commitImperialHeightInput = useCallback(() => {
    const feet = parseInt(heightFtInput.trim(), 10);
    const inches = parseInt(heightInInput.trim(), 10);
    const safeFeet = Number.isNaN(feet) ? 0 : Math.max(0, feet);
    const safeInches = Number.isNaN(inches) ? 0 : Math.max(0, inches);
    const totalInches = safeFeet * 12 + safeInches;

    updateProfile({
      heightCm: Math.round(totalInches / CM_TO_IN),
    });
  }, [heightFtInput, heightInInput, updateProfile]);

  return {
    weightInput,
    setWeightInput,
    heightCmInput,
    setHeightCmInput,
    heightFtInput,
    setHeightFtInput,
    heightInInput,
    setHeightInInput,
    commitWeightInput,
    commitMetricHeightInput,
    commitImperialHeightInput,
  };
}
