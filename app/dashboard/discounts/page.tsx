"use client";

import { useState, useEffect } from "react";
import { Percent, DollarSign, Save, AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function DiscountsPage() {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previewPrice, setPreviewPrice] = useState<number>(100);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await fetch('/api/vendor/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setDiscountType(data.vendor?.discountType || "percentage");
          setDiscountValue(data.vendor?.discountValue || 0);
        } catch (error) {
          console.error(error);
          setMessage({ type: 'error', text: 'Failed to load discount settings' });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getToken = () => {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "token") return value;
    }
    return null;
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (discountValue <= 0) return originalPrice;

    if (discountType === 'percentage') {
      return originalPrice * (1 - discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.max(0, originalPrice - discountValue);
    }
    return originalPrice;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ discountType, discountValue }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const data = await res.json();
      setMessage({ type: 'success', text: 'Discount settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving discount settings. Please try again.' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDiscountType("percentage");
    setDiscountValue(0);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading discount settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">💰 Discount Management</h1>
        <p className="text-blue-100">Configure promotional discounts for your restaurant menu</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Percent className="w-5 h-5 mr-2 text-blue-600" />
            Discount Settings
          </h2>

          {/* Discount Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  discountType === "percentage"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Percent className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Percentage</div>
                <div className="text-xs text-gray-500">e.g., 20% off</div>
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`p-4 border-2 rounded-lg transition-all ${
                  discountType === "fixed"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <DollarSign className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Fixed Amount</div>
                <div className="text-xs text-gray-500">e.g., ₹50 off</div>
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              placeholder={discountType === 'percentage' ? "Enter percentage (0-100)" : "Enter amount"}
            />
            {discountType === 'percentage' && discountValue > 100 && (
              <p className="text-red-500 text-sm mt-1">Percentage cannot exceed 100%</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {saving ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Price Preview
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Price (₹)
            </label>
            <input
              type="number"
              value={previewPrice}
              onChange={(e) => setPreviewPrice(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min={0}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Original Price:</span>
              <span className="font-semibold">₹{previewPrice}</span>
            </div>

            {discountValue > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600 font-medium">
                    -{discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}
                  </span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Final Price:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{Math.round(calculateDiscountedPrice(previewPrice))}
                  </span>
                </div>
                <div className="text-sm text-gray-500 text-center">
                  You save ₹{Math.round(previewPrice - calculateDiscountedPrice(previewPrice))}
                </div>
              </>
            )}
          </div>

          {discountValue === 0 && (
            <div className="text-center text-gray-500 mt-4">
              Set a discount value to see the preview
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Discount Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}
            </div>
            <div className="text-sm text-gray-600">Current Discount</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ₹{Math.round(calculateDiscountedPrice(100) - 100)}
            </div>
            <div className="text-sm text-gray-600">Savings on ₹100 item</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {discountValue > 0 ? 'Active' : 'Inactive'}
            </div>
            <div className="text-sm text-gray-600">Discount Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
