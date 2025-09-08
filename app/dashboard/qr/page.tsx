"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Share2, Copy, CheckCircle, AlertCircle, Loader} from "lucide-react";

function generateQRCodeSVG(text: string) {
  // Using qr-server.com API for reliable QR code generation
  const encodedText = encodeURIComponent(text);
  const size = 300;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&ecc=M`;
  return url;
}

export default function QRCodePage() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [restaurantUrl, setRestaurantUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getToken();

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        // ✅ Fetch vendor profile
        const profileRes = await fetch('/api/vendor/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          throw new Error(`Failed to fetch vendor profile: ${profileRes.status}`);
        }

        const profileData = await profileRes.json();
        const vendorRestaurantName = profileData.vendor?.restaurantName || 'your-restaurant';
        setRestaurantName(vendorRestaurantName);

        const fullUrl = `${window.location.origin}/restaurant/${encodeURIComponent(vendorRestaurantName)}`;
        setRestaurantUrl(fullUrl);
        setQrCodeUrl(generateQRCodeSVG(fullUrl));
        setError(null);

      } catch (err) {
        console.error('Error loading QR code:', err);
        setError(err instanceof Error ? err.message : 'Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getToken = () => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "token") return value;
    }
    return null;
  };

  const copyToClipboard = async () => {
    if (!restaurantUrl) {
      console.error('No restaurant URL to copy');
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(restaurantUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = restaurantUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Fallback copy failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show user-friendly error message
      alert("Failed to copy URL. Please copy manually: " + restaurantUrl);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${restaurantName || 'restaurant'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareQR = async () => {
    if (!restaurantUrl) {
      console.error('No restaurant URL to share');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurantName || 'Restaurant&apos;s'} Menu`,
          text: `Check out ${restaurantName || 'our&apos;s'} menu`,
          url: restaurantUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // If sharing fails, fall back to copying
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      // Fallback to copying for browsers that don&apos;t support Web Share API
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Generating QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading QR Code</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">📱 Restaurant QR Code</h1>
        <p className="text-green-100">Generate and share your restaurant&apos;s digital menu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Display */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-green-600" />
            QR Code Preview
          </h2>

          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white border-4 border-gray-100 rounded-xl shadow-lg">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Restaurant QR Code"
                  className="w-64 h-64"
                  onError={() => setError("Failed to load QR code image")}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {restaurantName || 'Your Restaurant'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code to view the menu
            </p>
          </div>
        </div>

        {/* Actions & Info */}
        <div className="space-y-6">
          {/* URL Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🔗 Restaurant URL</h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={restaurantUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Copy URL"
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                URL copied to clipboard!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={downloadQR}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download QR Code
              </button>

              <button
                onClick={shareQR}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Menu Link
              </button>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Usage Tips</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Print and place QR codes at your restaurant entrance</li>
              <li>• Add to your website or social media</li>
              <li>• Include in promotional materials</li>
              <li>• Customers can scan to view your digital menu instantly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 QR Code Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {restaurantUrl ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-gray-600">QR Code Status</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {restaurantName?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Restaurant Name Length</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              300x300
            </div>
            <div className="text-sm text-gray-600">QR Code Size</div>
          </div>
        </div>
      </div>
    </div>
  );
}
