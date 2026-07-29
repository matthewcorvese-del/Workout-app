import { useMemo } from 'react';
import { UserProfile } from '@/contexts/SettingsContext';
import { HeightUnit, WeightUnit } from '@/types/workout';

interface UseProfileDisplayValuesParams {
  profile: UserProfile;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
}

interface ProfileDisplayValues {
  displayWeight: string;
  displayHeight: string;
}

const KG_TO_LBS = 2.2046226218;
const CM_TO_IN = 0.3937007874;

export function useProfileDisplayValues({
  profile,
  weightUnit,
  heightUnit,
}: UseProfileDisplayValuesParams): ProfileDisplayValues {
  return useMemo(() => {
    const displayWeight = profile.weightKg
      ? weightUnit === 'lbs'
        ? `${(profile.weightKg * KG_TO_LBS).toFixed(1)} lbs`
        : `${profile.weightKg} kg`
      : 'Not set';

    let displayHeight = 'Not set';
    if (profile.heightCm > 0) {
      if (heightUnit === 'imperial') {
        const totalInches = Math.round(profile.heightCm * CM_TO_IN);
        displayHeight = `${Math.floor(totalInches / 12)} ft ${totalInches % 12} in`;
      } else {
        displayHeight = `${profile.heightCm} cm`;
      }
    }

    return {
      displayWeight,
      displayHeight,
    };
  }, [heightUnit, profile.heightCm, profile.weightKg, weightUnit]);
}
