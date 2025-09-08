"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Camera, X, AlertCircle, CheckCircle } from "lucide-react";

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    setScanner(html5QrcodeScanner);

    // Start scanning
    html5QrcodeScanner.render(
      (decodedText: string) => {
        setScanResult(decodedText);
        setIsScanning(false);
        html5QrcodeScanner.clear();
      },
      (errorMessage: string) => {
        console.warn("QR scan error:", errorMessage);
        // Only set error for actual errors, not for scanning attempts
        if (!errorMessage.includes("No QR code found")) {
          setError("Scanning failed. Please ensure camera permissions are granted.");
        }
      }
    ).catch((err) => {
      console.error("Failed to start scanner:", err);
      setError("Failed to access camera. Please check permissions and try again.");
      setIsScanning(false);
    });

    setIsScanning(true);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
      }
    };
  }, []);

  const handleScanAgain = () => {
    setScanResult(null);
    setError(null);
    if (scanner) {
      scanner.render(
        (decodedText: string) => {
          setScanResult(decodedText);
          setIsScanning(false);
          scanner.clear();
        },
        (errorMessage: string) => {
          console.warn("QR scan error:", errorMessage);
          setError("Scanning failed. Please try again.");
        }
      );
      setIsScanning(true);
    }
  };

  const handleResult = () => {
    if (scanResult) {
      // Check if it's a restaurant URL
      if (scanResult.includes("/restaurant/")) {
        window.location.href = scanResult;
      } else {
        setError("Invalid QR code. Please scan a restaurant menu QR code.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center">
          <Camera className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">QR Code Scanner</h1>
          <p className="text-blue-100">Scan restaurant menu QR codes</p>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {!scanResult ? (
            <div className="space-y-4">
              <div
                id="qr-reader"
                className="w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                style={{ minHeight: "300px" }}
              ></div>

              {isScanning && (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                    Scanning...
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">QR Code Detected!</h3>
                <p className="text-green-700 text-sm break-all">{scanResult}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResult}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Open Menu
                </button>
                <button
                  onClick={handleScanAgain}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            Point your camera at a restaurant QR code to view their menu
          </p>
        </div>
      </div>
    </div>
  );
}
