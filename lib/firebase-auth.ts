import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { firebaseAuth } from "./firebase-client";

let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaContainerId: string | null = null;

/**
 * Creates or reuses the Firebase reCAPTCHA verifier.
 */
export function setupRecaptcha(containerId: string) {
  // If an existing verifier belongs to a different container,
  // clear it before creating a new one.
  if (
    recaptchaVerifier &&
    recaptchaContainerId &&
    recaptchaContainerId !== containerId
  ) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      console.warn("Failed to clear previous reCAPTCHA:", error);
    }

    recaptchaVerifier = null;
    recaptchaContainerId = null;
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(
    firebaseAuth,
    containerId,
    {
      size: "invisible",
    }
  );

  recaptchaContainerId = containerId;

  return recaptchaVerifier;
}

/**
 * Sends an OTP to the supplied phone number.
 */
export async function sendPhoneOTP(
  phoneNumber: string,
  containerId: string
): Promise<ConfirmationResult> {
  try {
    const verifier = setupRecaptcha(containerId);

    return await signInWithPhoneNumber(
      firebaseAuth,
      phoneNumber,
      verifier
    );
  } catch (error) {
    // The verifier may now be invalid.
    // Clear it so the next OTP attempt starts fresh.
    resetRecaptcha();

    throw error;
  }
}

/**
 * Verifies the OTP returned by Firebase.
 */
export async function verifyPhoneOTP(
  confirmationResult: ConfirmationResult,
  otp: string
) {
  return await confirmationResult.confirm(otp);
}

/**
 * Clears the current Firebase reCAPTCHA instance.
 */
export function resetRecaptcha() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      console.warn("Failed to clear reCAPTCHA:", error);
    }
  }

  recaptchaVerifier = null;
  recaptchaContainerId = null;
}

/**
 * Logs the user out of Firebase and clears reCAPTCHA.
 */
export async function logoutFirebase() {
  await firebaseAuth.signOut();
  resetRecaptcha();
}
