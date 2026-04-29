export type TrainingPaymentStatus =
  | "pending"
  | "pending_receipt"
  | "pending_approval"
  | "successful"
  | "failed"
  | "none";

export type TrainingProgressInput = {
  applicationExists: boolean;
  programmeSelected: boolean;
  profileComplete: boolean;
  documentsComplete: boolean;
  paymentStatus: TrainingPaymentStatus;
};

export type TrainingProgress = {
  currentStep: number;
  maxAllowedStep: number;
  programmeDone: boolean;
  profileDone: boolean;
  documentsDone: boolean;
  paymentReviewReady: boolean;
  paymentDone: boolean;
};

export function getTrainingProgress(input: TrainingProgressInput): TrainingProgress {
  const programmeDone = input.applicationExists && input.programmeSelected;
  const profileDone = programmeDone && input.profileComplete;
  const documentsDone = profileDone && input.documentsComplete;
  const paymentReviewReady =
    documentsDone &&
    (input.paymentStatus === "pending_approval" || input.paymentStatus === "successful");
  const paymentDone = documentsDone && input.paymentStatus === "successful";

  let currentStep = 1;
  if (programmeDone) currentStep = 2;
  if (profileDone) currentStep = 3;
  if (documentsDone) currentStep = 4;
  if (paymentReviewReady) currentStep = 5;

  const maxAllowedStep = paymentReviewReady
    ? 5
    : documentsDone
      ? 4
      : profileDone
        ? 3
        : programmeDone
          ? 2
          : 1;

  return {
    currentStep,
    maxAllowedStep,
    programmeDone,
    profileDone,
    documentsDone,
    paymentReviewReady,
    paymentDone,
  };
}

export function getTrainingStepCompletion(step: number, progress: TrainingProgress) {
  if (step === 1) return progress.programmeDone;
  if (step === 2) return progress.profileDone;
  if (step === 3) return progress.documentsDone;
  if (step === 4) return progress.paymentReviewReady;
  if (step === 5) return progress.paymentDone;
  return false;
}

export function isTrainingStepOpen(step: number, progress: TrainingProgress) {
  if (step <= 1) return true;
  if (step === 2) return progress.programmeDone;
  if (step === 3) return progress.profileDone;
  if (step === 4) return progress.documentsDone;
  if (step >= 5) return progress.paymentReviewReady;
  return false;
}
