export type CoursePricingType = "free" | "paid";

export type CoursePaymentStatus =
  | "none"
  | "pending_receipt"
  | "pending_approval"
  | "successful"
  | "failed";

export type LearnerCourseState =
  | "free_available"
  | "payment_required"
  | "payment_pending"
  | "payment_rejected"
  | "active"
  | "completed";

export interface CourseCommerceMetadata {
  pricingType: CoursePricingType;
  amount: number;
  category: string;
  level: string;
  durationLabel: string;
  certificateEnabled: boolean;
  accent: string;
}

const DEFAULT_COURSE_METADATA: CourseCommerceMetadata = {
  pricingType: "free",
  amount: 0,
  category: "E-Learning",
  level: "General",
  durationLabel: "Self-paced",
  certificateEnabled: true,
  accent: "#2D5A2D",
};

const COURSE_COMMERCE_METADATA: Record<string, CourseCommerceMetadata> = {
  "foundations-food-security": {
    pricingType: "free",
    amount: 0,
    category: "Food Science",
    level: "Beginner",
    durationLabel: "6 hrs",
    certificateEnabled: true,
    accent: "#7C3AED",
  },
  "post-harvest-management-storage": {
    pricingType: "paid",
    amount: 5000,
    category: "Agribusiness",
    level: "Intermediate",
    durationLabel: "8 hrs",
    certificateEnabled: true,
    accent: "#2D5A2D",
  },
  "soil-health-fertility-management": {
    pricingType: "free",
    amount: 0,
    category: "Soil & Crops",
    level: "Beginner",
    durationLabel: "5 hrs",
    certificateEnabled: true,
    accent: "#B45309",
  },
  "value-chain-analysis-agribusiness": {
    pricingType: "paid",
    amount: 8000,
    category: "Agribusiness",
    level: "Advanced",
    durationLabel: "9 hrs",
    certificateEnabled: true,
    accent: "#1E40AF",
  },
  "climate-smart-agriculture-elearning": {
    pricingType: "paid",
    amount: 5000,
    category: "Climate",
    level: "Intermediate",
    durationLabel: "7 hrs",
    certificateEnabled: true,
    accent: "#0369A1",
  },
  "food-safety-quality-assurance": {
    pricingType: "paid",
    amount: 8000,
    category: "Food Science",
    level: "Intermediate",
    durationLabel: "8 hrs",
    certificateEnabled: true,
    accent: "#9D174D",
  },
};

export function getCourseCommerceMetadata(slug: string): CourseCommerceMetadata {
  return COURSE_COMMERCE_METADATA[slug] || DEFAULT_COURSE_METADATA;
}

export function getCoursePricing(slug: string): {
  pricingType: CoursePricingType;
  amount: number;
} {
  const metadata = getCourseCommerceMetadata(slug);
  return {
    pricingType: metadata.pricingType,
    amount: metadata.amount,
  };
}

export function resolveLearnerCourseAccess(input: {
  pricingType: CoursePricingType;
  hasEnrollment: boolean;
  paymentStatus: CoursePaymentStatus;
  hasCertificate: boolean;
  progressPercent: number;
}): {
  state: LearnerCourseState;
  canAccessContent: boolean;
  ctaLabel: string;
} {
  if (input.hasCertificate || input.progressPercent >= 100) {
    return {
      state: "completed",
      canAccessContent: true,
      ctaLabel: "View Certificate",
    };
  }

  if (input.pricingType === "free") {
    if (!input.hasEnrollment) {
      return {
        state: "free_available",
        canAccessContent: false,
        ctaLabel: "Enroll for Free",
      };
    }

    return {
      state: "active",
      canAccessContent: true,
      ctaLabel: "Continue Learning",
    };
  }

  if (!input.hasEnrollment || input.paymentStatus === "none") {
    return {
      state: "payment_required",
      canAccessContent: false,
      ctaLabel: "Start Paid Enrollment",
    };
  }

  if (input.paymentStatus === "failed") {
    return {
      state: "payment_rejected",
      canAccessContent: false,
      ctaLabel: "Fix Payment",
    };
  }

  if (input.paymentStatus === "pending_approval") {
    return {
      state: "payment_pending",
      canAccessContent: false,
      ctaLabel: "Awaiting Approval",
    };
  }

  if (input.paymentStatus === "pending_receipt") {
    return {
      state: "payment_required",
      canAccessContent: false,
      ctaLabel: "Upload Receipt",
    };
  }

  return {
    state: "active",
    canAccessContent: true,
    ctaLabel: "Continue Learning",
  };
}
