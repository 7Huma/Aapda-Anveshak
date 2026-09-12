import { useEffect, useState } from "react";


type StartSequenceProps = {
  onComplete: () => void;
};

type UserInfo = {
  name: string;
  email: string;
  picture?: string;
};

export default function StartSequence({
  onComplete,
}: StartSequenceProps) {
  const [phase, setPhase] = useState<
    "intro" | "registration"
  >("intro");

  const [user, setUser] = useState<UserInfo | null>(null);
  const [locationAllowed, setLocationAllowed] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase("registration");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = () => {
    /*
      TEMPORARY DEMO GOOGLE SIGN-IN

      Replace this with real Google OAuth once
      your Google Client ID is configured.
    */

    setUser({
      name: "Google User",
      email: "Signed in with Google",
    });
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not supported by this browser."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Latitude:", position.coords.latitude);
        console.log("Longitude:", position.coords.longitude);

        setLocationAllowed(true);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location permission error:", error);

        setLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location permission was denied. Please allow location access."
          );
        } else {
          setLocationError(
            "Unable to get your current location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const enterDashboard = () => {
    if (!user) {
      return;
    }

    if (!locationAllowed) {
      requestLocation();
      return;
    }

    onComplete();
  };

  return (
    <div className="start-sequence">

      {/* =========================================
          INTRO
          ========================================= */}

      {phase === "intro" && (
        <div className="start-intro">

          <div className="start-title">
            <span>AAPDA</span>
            <span>ANVESHAK</span>
          </div>

          <div className="start-line" />

          <div className="start-subtitle">
            AI-BASED EARLY WARNING & LANDSLIDE
            <br />
            RISK MONITORING SYSTEM
          </div>

        </div>
      )}

      {/* =========================================
          REGISTRATION
          ========================================= */}

      {phase === "registration" && (
        <div className="registration-screen">

          <div className="registration-box">

            <div className="registration-brand">
              <span className="registration-dot" />
              AAPDA ANVESHAK
            </div>

            <h1>Welcome</h1>

            <p className="registration-description">
              Sign in to access AI-powered landslide
              risk monitoring and early warnings.
            </p>

            {!user ? (
              <>
                <button
                  className="google-signin-button"
                  type="button"
                  onClick={handleGoogleSignIn}
                >
                  <span className="google-icon">
                    G
                  </span>

                  <span>
                    Continue with Google
                  </span>
                </button>

                <div className="registration-divider">
                  <span />
                  SECURE REGISTRATION
                  <span />
                </div>

                <p className="registration-note">
                  Your account is used to personalize
                  alerts and monitoring preferences.
                </p>
              </>
            ) : (
              <div className="signed-in-section">

                <div className="user-card">

                  <div className="user-avatar">
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>

                  <span className="verified">
                    ✓
                  </span>

                </div>

                {/* LOCATION */}
                <div
                  className={`location-permission ${
                    locationAllowed
                      ? "allowed"
                      : ""
                  }`}
                >
                  <div className="location-icon">
                    {locationAllowed ? "✓" : "⌖"}
                  </div>

                  <div className="location-copy">
                    <strong>
                      {locationAllowed
                        ? "Location access enabled"
                        : "Enable location access"}
                    </strong>

                    <small>
                      {locationAllowed
                        ? "Used to provide location-specific risk information."
                        : "Allow location access for nearby landslide warnings."}
                    </small>
                  </div>

                  {!locationAllowed && (
                    <button
                      type="button"
                      className="allow-location"
                      onClick={requestLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading
                        ? "REQUESTING..."
                        : "ALLOW"}
                    </button>
                  )}
                </div>

                {locationError && (
                  <div className="location-error">
                    {locationError}
                  </div>
                )}

                <button
                  type="button"
                  className="enter-dashboard"
                  onClick={enterDashboard}
                  disabled={!locationAllowed}
                >
                  ENTER DASHBOARD
                  <span>→</span>
                </button>

              </div>
            )}

          </div>

          <div className="registration-footer">
            AI EARLY WARNING & LANDSLIDE RISK MONITORING
          </div>

        </div>
      )}

    </div>
  );
}