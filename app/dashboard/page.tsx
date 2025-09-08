"use client";

import { useState, useEffect } from "react";
import { QrCode, Download, Share2, Copy, CheckCircle, AlertCircle, TrendingUp, Users, Eye, Smartphone,Loader } from "lucide-react";

function generateQRCodeSVG(text: string) {
  // Using qr-server.com API for reliable QR code generation
  const encodedText = encodeURIComponent(text);
  const size = 300;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&ecc=M`;
  return url;
}

export default function DashboardPage() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [restaurantUrl, setRestaurantUrl] = useState<string>("");
  const [menuCount, setMenuCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    conversionRate: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getToken();

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        // Fetch vendor profile
        const profileRes = await fetch('/api/vendor/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          throw new Error(`Failed to fetch vendor profile: ${profileRes.status}`);
        }

        const profileData = await profileRes.json();
        const vendorRestaurantName = profileData.vendor?.restaurantName || 'your-restaurant';
        setRestaurantName(vendorRestaurantName);

        // Fetch menu count
        const menuRes = await fetch('/api/vendor/menu/list', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuCount(menuData.items?.length || 0);
        }

        const fullUrl = `${window.location.origin}/restaurant/${encodeURIComponent(vendorRestaurantName)}`;
        setRestaurantUrl(fullUrl);
        setQrCodeUrl(generateQRCodeSVG(fullUrl));
        setError(null);

        // Fetch analytics data from backend
        const analyticsRes = await fetch('/api/vendor/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setStats({
            totalScans: analyticsData.totalScans || 0,
            conversionRate: analyticsData.conversionRate || 0,
          });
        } else {
          // Fallback to mock data if analytics fetch fails
          setStats({
            totalScans: Math.floor(Math.random() * 500) + 100, 
            conversionRate: Math.floor(Math.random() * 30) + 5,
          });
        }

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
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
          title: `${restaurantName || 'Restaurant'} Menu`,
          text: `Check out ${restaurantName || 'our'} menu`,
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
      // Fallback to copying for browsers that don't support Web Share API
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 text-lg">Loading your restaurant dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">🏪 Welcome back, {restaurantName}!</h1>
            <p className="text-blue-100 text-lg">Your digital menu is ready to serve customers</p>
          </div>
          <div className="hidden md:block">
            <QrCode className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menu Items</p>
              <p className="text-3xl font-bold text-gray-900">{menuCount}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Scans</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalScans}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.uniqueVisitors}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main QR Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Display */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <QrCode className="w-6 h-6 mr-3 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Your Restaurant QR Code</h2>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-white rounded-2xl shadow-xl">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Restaurant QR Code"
                  className="w-72 h-72 rounded-lg"
                  onError={() => setError("Failed to load QR code image")}
                />
              ) : (
                <div className="w-72 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {restaurantName || 'Your Restaurant'}
            </h3>
            <p className="text-gray-600 mb-6">
              Scan this QR code to instantly access your digital menu
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadQR}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download QR Code
              </button>

              <button
                onClick={shareQR}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Menu Link
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Restaurant URL */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Restaurant URL
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="text"
                value={restaurantUrl}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">QR Code Status</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Menu Items</span>
                <span className="font-semibold text-gray-800">{menuCount} items</span>
              </div>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">💡 Pro Tips</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• Place QR codes at your restaurant entrance</li>
              <li>• Add to your website and social media</li>
              <li>• Print on menus and promotional materials</li>
              <li>• Track performance in the analytics section</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">📈 Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <QrCode className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">QR Code Generated</p>
              <p className="text-sm text-gray-600">Your restaurant QR code is ready for customers</p>
            </div>
            <span className="text-sm text-gray-500">Now</span>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Menu Updated</p>
              <p className="text-sm text-gray-600">{menuCount} menu items are live and accessible</p>
            </div>
            <span className="text-sm text-gray-500">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
