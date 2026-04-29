export type ApplicationPaymentStatus =
  | "pending"
  | "pending_receipt"
  | "pending_approval"
  | "successful"
  | "failed"
  | "none";

export type ApplicationProgressInput = {
  programmeSelected: boolean;
  personalDetailsComplete: boolean;
  documentsComplete: boolean;
  paymentStatus: ApplicationPaymentStatus;
};

export type ApplicationProgress = {
  currentStep: number;
  maxAllowedStep: number;
  programmeDone: boolean;
  personalDone: boolean;
  documentsDone: boolean;
  paymentReviewReady: boolean;
  paymentDone: boolean;
};

export function getApplicationProgress(
  input: ApplicationProgressInput
): ApplicationProgress {
  const programmeDone = input.programmeSelected;
  const personalDone = programmeDone && input.personalDetailsComplete;
  const documentsDone = personalDone && input.documentsComplete;
  const paymentReviewReady =
    documentsDone &&
    (input.paymentStatus === "pending_approval" ||
      input.paymentStatus === "successful");
  const paymentDone = documentsDone && input.paymentStatus === "successful";

  let currentStep = 1;
  if (programmeDone) currentStep = 2;
  if (personalDone) currentStep = 3;
  if (documentsDone) currentStep = 4;
  if (paymentReviewReady) currentStep = 5;

  const maxAllowedStep = paymentReviewReady
    ? 5
    : documentsDone
      ? 4
      : personalDone
        ? 3
        : programmeDone
          ? 2
          : 1;

  return {
    currentStep,
    maxAllowedStep,
    programmeDone,
    personalDone,
    documentsDone,
    paymentReviewReady,
    paymentDone,
  };
}

export function getStepCompletion(step: number, progress: ApplicationProgress) {
  if (step === 1) return progress.programmeDone;
  if (step === 2) return progress.personalDone;
  if (step === 3) return progress.documentsDone;
  if (step === 4) return progress.paymentReviewReady;
  if (step === 5) return progress.paymentDone;
  return false;
}

export function isStepOpen(step: number, progress: ApplicationProgress) {
  if (step <= 1) return true;
  if (step === 2) return progress.programmeDone;
  if (step === 3) return progress.personalDone;
  if (step === 4) return progress.documentsDone;
  if (step >= 5) return progress.paymentReviewReady;
  return false;
}
