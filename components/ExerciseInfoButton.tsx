import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Info, X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { fetchExerciseDbExerciseById } from '@/lib/exerciseDb';

interface ExerciseInfoButtonProps {
  exerciseId: string;
  exerciseName: string;
  gifUrl?: string;
  description?: string;
  iconSize?: number;
}

export default function ExerciseInfoButton({
  exerciseId,
  exerciseName,
  gifUrl,
  description,
  iconSize = 14,
}: ExerciseInfoButtonProps) {
  const [visible, setVisible] = useState(false);
  const [gifAspectRatio, setGifAspectRatio] = useState(16 / 9);

  const {
    data: exerciseDetails,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['exercise-db-exercise-detail', exerciseId],
    queryFn: () => fetchExerciseDbExerciseById(exerciseId),
    enabled: visible && Boolean(exerciseId),
    staleTime: 10 * 60 * 1000,
  });

  const resolvedGifUrl = exerciseDetails?.gifUrl || gifUrl;

  useEffect(() => {
    setGifAspectRatio(16 / 9);
  }, [resolvedGifUrl]);

  const resolvedDescription = useMemo(() => {
    if (exerciseDetails?.instructions?.trim()) {
      return exerciseDetails.instructions.trim();
    }
    if (description?.trim()) {
      return description.trim();
    }
    return 'No description available for this exercise yet.';
  }, [description, exerciseDetails?.instructions]);

  return (
    <>
      <TouchableOpacity
        style={styles.infoButton}
        activeOpacity={0.7}
        onPress={(event) => {
          event.stopPropagation?.();
          setVisible(true);
        }}
      >
        <Info size={iconSize} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {exerciseName}
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.loadingText}>Loading exercise details...</Text>
              </View>
            ) : (
              <>
                {resolvedGifUrl ? (
                  <Image
                    source={{ uri: resolvedGifUrl }}
                    style={[styles.gifImage, { aspectRatio: gifAspectRatio }]}
                    resizeMode="contain"
                    onLoad={({ nativeEvent }) => {
                      const width = nativeEvent.source?.width;
                      const height = nativeEvent.source?.height;
                      if (width && height) {
                        setGifAspectRatio(width / height);
                      }
                    }}
                  />
                ) : (
                  <View style={styles.emptyImageState}>
                    <Text style={styles.emptyImageText}>No exercise GIF available</Text>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{resolvedDescription}</Text>

                {isError && (
                  <Text style={styles.errorText}>
                    Some live details could not be loaded right now.
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  gifImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  emptyImageState: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImageText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  descriptionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: Colors.warning,
    fontSize: 12,
  },
});