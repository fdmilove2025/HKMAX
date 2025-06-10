import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const FacialRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Instructions, 2: Camera, 3: Processing, 4: Success
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { registerFace, currentUser } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/facial-registration' } });
    }
  }, [currentUser, navigate]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Effect to handle camera initialization when step changes to 2
  useEffect(() => {
    if (step === 2 && !cameraActive) {
      initializeCamera();
    }
  }, [step, cameraActive]);

  const initializeCamera = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      console.log("Camera access granted:", stream);

      if (videoRef.current) {
        console.log("Setting up video element...");
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Force video element to update
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current
            .play()
            .then(() => {
              console.log("Video playback started");
              setCameraActive(true);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              setError("Error starting camera preview. Please try again.");
            });
        };
      } else {
        console.error("Video element reference is null");
        setError("Error: Video element not found");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(
        "Unable to access camera. Please make sure you have granted camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas reference is null");
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL("image/jpeg");
    return imageData;
  };

  const handleCapture = async () => {
    try {
      setLoading(true);
      setError("");

      const imageData = captureImage();
      if (!imageData) {
        throw new Error("Failed to capture image");
      }

      // Send image to backend for registration
      const result = await registerFace(imageData);
      if (result.success) {
        setStep(4); // Move to success step
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to register face");
      }
    } catch (err) {
      setError(err.message || "Failed to register face");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep(1);
    setError("");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Set Up Facial Login
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We'll need to capture your face for secure login. Please ensure
              you're in a well-lit area and your face is clearly visible.
            </p>
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan hover:from-futuristic-cyan hover:to-futuristic-blue dark:hover:from-futuristic-cyan dark:hover:to-neon-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Start Camera"}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className="relative w-full max-w-md mx-auto mb-4 aspect-video bg-gray-100 dark:bg-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg shadow-lg"
                style={{ transform: "scaleX(-1)" }}
                onError={(e) => {
                  console.error("Video element error:", e);
                  setError("Error displaying video preview");
                }}
              />
              <div className="absolute inset-0 border-2 border-futuristic-blue dark:border-neon-blue rounded-lg pointer-events-none"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Position your face within the frame and ensure good lighting
            </p>
            <button
              onClick={handleCapture}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-futuristic-blue to-futuristic-cyan dark:from-neon-blue dark:to-futuristic-cyan hover:from-futuristic-cyan hover:to-futuristic-blue dark:hover:from-futuristic-cyan dark:hover:to-neon-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Capture"}
            </button>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-futuristic-blue dark:border-neon-blue mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Processing Face Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we process your facial data...
            </p>
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Registration Successful!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Facial Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Set up facial recognition for secure login
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel bg-white/80 dark:bg-dark-100/70 py-8 px-4 shadow sm:rounded-lg sm:px-10 backdrop-blur-md border border-gray-200 dark:border-dark-300/50 transition-all duration-300">
          {error && (
            <div
              className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md relative"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {renderStep()}

          {/* Only show email login option if user is not authenticated */}
          {!currentUser && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-dark-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-dark-100 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-200 hover:bg-gray-50 dark:hover:bg-dark-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-futuristic-blue dark:focus:ring-neon-blue transition-all duration-200"
                >
                  Email Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default FacialRegistration;
