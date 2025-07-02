import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Map } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Looks like we couldn't find the location you're looking for on our map. This page doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium text-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/map"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md font-medium text-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Map className="h-5 w-5 mr-2" />
            Explore Map
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;