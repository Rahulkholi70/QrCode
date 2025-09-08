"use client";

import React, { useEffect, useState } from 'react'
import { Loader } from 'lucide-react';

interface MenuItem {
  name: string;
  price: number;
  category: string;
  image?: string;
}

interface VendorProfile {
  restaurantName?: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

export default function RestaurantMenuPage({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant } = React.use(params);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`/api/menu/public?restaurant=${encodeURIComponent(restaurant)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        setMenuItems(data.items || []);
        setVendorProfile(data.vendor || null);
        setError(null);

        // Track menu view analytics
        try {
          await fetch('/api/vendor/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventType: 'menu_view',
              restaurantName: restaurant,
              metadata: {
                itemCount: data.items?.length || 0,
                source: 'restaurant_page'
              }
            })
          });
        } catch (analyticsError) {
          console.warn('Analytics tracking failed:', analyticsError);
        }

      } catch (error) {
        console.error('Error fetching menu:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Track page visit and scan analytics
    const trackVisit = async () => {
      try {
        // Check URL parameters for explicit scan tracking
        const urlParams = new URLSearchParams(window.location.search);
        const sourceParam = urlParams.get('source');
        const isExplicitScan = sourceParam === 'qr_scan';

        // Check if this is likely a QR scan (no referrer or direct access)
        const isLikelyScan = !document.referrer || document.referrer === '' ||
                            document.referrer.includes(window.location.hostname) === false;

        // Track scan event if explicitly from QR or likely a scan
        if (isExplicitScan || isLikelyScan) {
          await fetch('/api/vendor/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventType: 'scan',
              restaurantName: restaurant,
              metadata: {
                page: 'restaurant_menu',
                source: isExplicitScan ? 'qr_scan_explicit' : 'qr_scan_likely',
                userAgent: navigator.userAgent,
                urlParams: Object.fromEntries(urlParams.entries())
              }
            })
          });
        }

        // Always track visit
        await fetch('/api/vendor/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'visit',
            restaurantName: restaurant,
            metadata: {
              page: 'restaurant_menu',
              source: isExplicitScan ? 'qr_scan_explicit' : (isLikelyScan ? 'qr_scan_likely' : (document.referrer || 'direct')),
              userAgent: navigator.userAgent,
              urlParams: Object.fromEntries(urlParams.entries())
            }
          })
        });
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
      }
    };

    trackVisit();
    fetchMenu();
  }, [restaurant]);

  if (loading) {
     
    return  (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader className="w-15 h-15   animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading menu please wait for a moment........</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Menu</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return <p className="text-center text-gray-500">No menu items found for {restaurant}.</p>;
  }

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!vendorProfile?.discountType || !vendorProfile?.discountValue || vendorProfile.discountValue <= 0) {
      return originalPrice;
    }

    if (vendorProfile.discountType === 'percentage') {
      return originalPrice * (1 - vendorProfile.discountValue / 100);
    } else if (vendorProfile.discountType === 'fixed') {
      return Math.max(0, originalPrice - vendorProfile.discountValue);
    }

    return originalPrice;
  };

  // Check if discount is active
  const hasActiveDiscount = vendorProfile?.discountType && vendorProfile?.discountValue && vendorProfile.discountValue > 0;

  // Calculate total savings for display
  const calculateSavings = (originalPrice: number) => {
    return originalPrice - calculateDiscountedPrice(originalPrice);
  };

  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center mb-4">
            {vendorProfile?.logo && (
              <img
                src={vendorProfile.logo}
                alt={`${restaurant} logo`}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-4 border-white shadow-lg mb-4"
              />
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              🍽️ {vendorProfile?.restaurantName || restaurant}
            </h1>
             
              <p className="text-lg text-gray-600 mb-2 italic">{vendorProfile?.description || 'Delicious food awaits you!'}</p>
            
            {/* <p className="text-base text-gray-500">Delicious food awaits you!</p> */}
          </div>

          {/* Contact Information */}
          {(vendorProfile?.phone || vendorProfile?.address) && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4 text-sm text-gray-600">
              {vendorProfile.phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{vendorProfile.phone}</span>
                </div>
              )}
              {vendorProfile.address && (
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{vendorProfile.address}</span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Discount Banner */}
        {hasActiveDiscount && (
          <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-4xl">🎉</div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">Special Discount Active!</h2>
                <p className="text-red-100">
                  {vendorProfile?.discountType === 'percentage'
                    ? `${vendorProfile.discountValue}% off on all items`
                    : `₹${vendorProfile?.discountValue} off on all items`
                  }
                </p>
                <p className="text-sm text-red-200 mt-2">
                  Save money on your favorite dishes! Limited time offer.
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        )}

        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl text-gray-500">Menu is being prepared...</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 capitalize border-b-2 border-orange-300 pb-2">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {items.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="h-48 bg-gray-200 relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <span className="text-gray-500 text-4xl">🍽️</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white rounded-lg px-3 py-2 shadow-lg">
                        {hasActiveDiscount ? (
                          <div className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500 line-through">₹{item.price}</span>
                              <span className="text-lg font-bold text-red-600">₹{Math.round(calculateDiscountedPrice(item.price))}</span>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                Save ₹{Math.round(calculateSavings(item.price))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
