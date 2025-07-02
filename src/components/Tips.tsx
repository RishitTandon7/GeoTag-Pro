import React from 'react';
import { Lightbulb, MapPin, Navigation, Search, Edit, Download, Share2 } from 'lucide-react';

const Tips = () => {
  return (
    <div className="bg-neutral rounded-2xl p-8 shadow-md border border-neutral-200">
      <div className="flex items-center mb-8">
        <div className="bg-accent p-3 rounded-xl">
          <Lightbulb className="h-6 w-6 text-neutral" />
        </div>
        <h2 className="ml-4 text-xl font-semibold text-primary">Quick Tips</h2>
      </div>
      
      <div className="space-y-8">
        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <Search className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Search Locations
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Type any location name, landmark, or address in India to find it quickly. Results appear as you type.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <Navigation className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Current Location
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Use the "Get My Location" button to automatically detect and tag your current position in India.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <MapPin className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Custom Locations
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Can't find your location? Add a custom one with exact coordinates and address details.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <Edit className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Edit Information
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Customize location details, add descriptions, and adjust coordinates for perfect accuracy.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <Download className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Download Photos
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Save your geotagged photos with location watermarks. Perfect for sharing on social media.
              </p>
            </div>
          </div>
        </div>

        <div className="group">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-3 rounded-xl group-hover:bg-primary transition-all duration-300">
              <Share2 className="h-5 w-5 text-neutral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Share Locations
              </h3>
              <p className="mt-2 text-sm text-primary leading-relaxed">
                Each location gets a unique, shareable URL. Perfect for sharing specific spots with friends.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-neutral-200">
        <div className="bg-primary rounded-xl p-6 text-neutral shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="bg-accent p-2 rounded-lg">
              <Lightbulb className="h-5 w-5 text-neutral" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Pro Tip</h4>
              <p className="mt-1 text-sm text-neutral leading-relaxed">
                For the best results, allow location access and use high-resolution photos (minimum 1920×1080px).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tips;