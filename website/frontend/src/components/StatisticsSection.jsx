import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import { getBackendUrl } from '../utils/connectionHelper';

const StatisticsSection = () => {
  // State to store statistics data from API
  const [statistics, setStatistics] = useState([
    { id: 1, title: 'Total Page Views', value: 0, icon: '👁️' },
    { id: 2, title: 'Trusted Doctors', value: 0, icon: '👨‍⚕️' },
    { id: 3, title: 'Appointments Booked', value: 0, icon: '📅' },
  ]);

  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use intersection observer to trigger animation when component is in view
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // State to hold current count values during animation
  const [counts, setCounts] = useState(statistics.map(() => 0));

  // Fetch statistics data from API
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const backendUrl = getBackendUrl();
        console.log('Fetching statistics from:', `${backendUrl}/api/statistics`);

        const response = await axios.get(`${backendUrl}/api/statistics`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.success) {
          console.log('Statistics data received:', response.data.data);
          setStatistics(response.data.data);
          setError(null);
        } else {
          console.warn('API returned unsuccessful response:', response.data);
          setError('Failed to fetch statistics data');
        }
      } catch (err) {
        console.error('Error fetching statistics:', err.message);
        setError(`Failed to connect to the server: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Counter animation effect
  useEffect(() => {
    if (!inView || loading) return;

    const timers = [];

    // Reset all counts to zero first
    setCounts(statistics.map(() => 0));

    statistics.forEach((stat, index) => {
      // Animate count
      const duration = 2000; // 2 seconds
      const steps = 50;
      const increment = stat.value / steps;
      const stepTime = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setCounts(prev => {
            const newCounts = [...prev];
            newCounts[index] = Math.round(increment * currentStep);
            return newCounts;
          });
        } else {
          setCounts(prev => {
            const newCounts = [...prev];
            newCounts[index] = stat.value; // Ensure final value is exact
            return newCounts;
          });
          clearInterval(timer);
        }
      }, stepTime);

      timers.push(timer);
    });

    // Cleanup function to clear all timers
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [inView, statistics, loading]);

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 py-16 px-4 sm:px-6 lg:px-8 rounded-lg my-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Our Impact in Numbers</h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Transforming healthcare access across India
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              Note: Using estimated statistics. {error}
            </p>
          )}
        </div>

        <div ref={ref} className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {statistics.map((stat, index) => (
            <div
              key={stat.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary rounded-md p-3">
                  <span className="text-2xl text-white">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.title}</dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {loading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : (
                          formatNumber(counts[index])
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatisticsSection;