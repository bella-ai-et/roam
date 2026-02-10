import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable, Alert } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { useAppTheme, AppColors } from "@/lib/theme";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

import { OnboardingStepIndicator } from "./OnboardingStepIndicator";
import { WelcomeStep } from "./steps/WelcomeStep";
import { NameStep } from "./steps/NameStep";
import { BirthdayStep } from "./steps/BirthdayStep";
import { GenderStep } from "./steps/GenderStep";
import { PhotosStep } from "./steps/PhotosStep";
import { LookingForStep } from "./steps/LookingForStep";
import { TravelStyleStep } from "./steps/TravelStyleStep";
import { InterestsStep } from "./steps/InterestsStep";
import { VanStep } from "./steps/VanStep";
import { ReviewStep } from "./steps/ReviewStep";

const TOTAL_STEPS = 10; // 0-9
const SCREEN_W = Dimensions.get("window").width;

type SubmitState = "editing" | "saving" | "submitted";

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { clerkUser, currentUser } = useCurrentUser();
  const createProfile = useMutation(api.users.createProfile);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  // ── Step navigation ──
  const [step, setStep] = useState(0);
  const directionRef = useRef<"forward" | "back">("forward");
  const isFirstRender = useRef(true);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    translateX.value = directionRef.current === "forward" ? SCREEN_W : -SCREEN_W;
    translateX.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 });
  }, [step]);

  const stepAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const goNext = useCallback(() => {
    hapticSelection();
    directionRef.current = "forward";
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    hapticSelection();
    directionRef.current = "back";
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // ── Form data (local state, batch save at end) ──
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [gender, setGender] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [localPhotos, setLocalPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [travelStyles, setTravelStyles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [vanType, setVanType] = useState<string | undefined>();
  const [vanBuildStatus, setVanBuildStatus] = useState<string | undefined>();
  const [lifestyleLabel, setLifestyleLabel] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>("editing");
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);

  const handleAddPhoto = useCallback((storageId: string, uri: string) => {
    setPhotos((prev) => [...prev, storageId]);
    setLocalPhotos((prev) => [...prev, { id: storageId, uri }]);
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setLocalPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!clerkUser?.id || !dob) return;
    setSubmitState("saving");
    try {
      const profileId = await createProfile({
        clerkId: clerkUser.id,
        name: name.trim(),
        dateOfBirth: dob.getTime(),
        gender,
        photos,
        interests,
        lookingFor,
        vanType,
        vanBuildStatus,
        vanVerified: false,
        travelStyles: travelStyles.length > 0 ? travelStyles : undefined,
        lifestyleLabel: lifestyleLabel.trim() || undefined,
      });
      setCreatedProfileId(profileId as unknown as string);
      hapticSuccess();
      setSubmitState("submitted");
    } catch (err: any) {
      hapticError();
      Alert.alert("Error", err?.message || "Failed to submit application.");
      setSubmitState("editing");
    }
  };

  const handleViewProfile = async () => {
    const userId = currentUser?._id ?? createdProfileId;
    if (!userId) return;
    try {
      await completeOnboarding({ userId: userId as any });
      // _layout.tsx will reactively redirect to (pending)
    } catch {
      // fallback — try again
    }
  };

  // ── Submitted celebration ──
  if (submitState === "submitted") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.celebrationContent}>
          <Animated.View
            entering={ZoomIn.springify().damping(12).stiffness(150)}
            style={[styles.checkCircle, { backgroundColor: AppColors.primary }]}
          >
            <Ionicons name="paper-plane" size={36} color="#FFFFFF" />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(300).duration(500)}
            style={[styles.celebrationTitle, { color: colors.onSurface }]}
          >
            Application Submitted
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(500).duration(500)}
            style={[styles.celebrationSubtitle, { color: colors.onSurfaceVariant }]}
          >
            We'll review your profile and get back to you soon.{"\n"}
            In the meantime, you can view and edit your profile.
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(700).duration(500)} style={styles.celebrationButton}>
            <Pressable style={styles.viewProfileButton} onPress={handleViewProfile}>
              <Text style={styles.viewProfileText}>View My Profile</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Step rendering ──
  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeStep onNext={goNext} />;
      case 1:
        return <NameStep name={name} onChangeName={setName} onNext={goNext} />;
      case 2:
        return <BirthdayStep dob={dob} onChangeDob={setDob} onNext={goNext} />;
      case 3:
        return <GenderStep gender={gender} onChangeGender={setGender} onNext={goNext} />;
      case 4:
        return (
          <PhotosStep
            photos={photos}
            localPhotos={localPhotos}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            onNext={goNext}
          />
        );
      case 5:
        return (
          <LookingForStep
            lookingFor={lookingFor}
            onChangeLookingFor={setLookingFor}
            onNext={goNext}
          />
        );
      case 6:
        return (
          <TravelStyleStep
            travelStyles={travelStyles}
            onChangeTravelStyles={setTravelStyles}
            onNext={goNext}
          />
        );
      case 7:
        return (
          <InterestsStep
            interests={interests}
            onChangeInterests={setInterests}
            onNext={goNext}
          />
        );
      case 8:
        return (
          <VanStep
            vanType={vanType}
            vanBuildStatus={vanBuildStatus}
            onChangeVanType={setVanType}
            onChangeVanBuildStatus={setVanBuildStatus}
            onNext={goNext}
          />
        );
      case 9:
        return (
          <ReviewStep
            name={name}
            dob={dob}
            gender={gender}
            localPhotos={localPhotos}
            lookingFor={lookingFor}
            travelStyles={travelStyles}
            interests={interests}
            vanType={vanType}
            vanBuildStatus={vanBuildStatus}
            lifestyleLabel={lifestyleLabel}
            onChangeLifestyleLabel={setLifestyleLabel}
            saving={submitState === "saving"}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  // Welcome step (0) is full-screen with no header/indicator
  if (step === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderStep()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back + step indicator */}
      <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={goBack} style={styles.headerBackButton} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <OnboardingStepIndicator currentStep={step - 1} totalSteps={TOTAL_STEPS - 1} />
      </View>

      {/* Animated step content */}
      <View style={styles.stepWrapper}>
        <Animated.View style={[styles.stepContainer, stepAnimStyle]}>
          {renderStep()}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 32,
    paddingBottom: 8,
    alignItems: "center",
  },
  headerBackButton: {
    position: "absolute",
    left: 24,
    bottom: 12,
    zIndex: 10,
  },
  stepWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  stepContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  // Celebration state
  celebrationContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 32,
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 24,
  },
  celebrationButton: {
    width: "100%",
    maxWidth: 300,
  },
  viewProfileButton: {
    backgroundColor: AppColors.primary,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});
