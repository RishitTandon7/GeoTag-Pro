import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Image, Map, Edit, Shield, Camera } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-blue-700 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 opacity-90"></div>
        <div 
          className="absolute inset-0 opacity-20" 
          style={{ 
            backgroundImage: "url('https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'overlay'
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="md:w-2/3">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Add Location Context to Your Photography
            </h1>
            <p className="text-xl mb-8">
              GeoTag Pro helps you organize, share, and explore photos through location data. Create beautiful maps of your photography journey.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                to="/map" 
                className="px-8 py-3 bg-white text-blue-700 rounded-md font-medium text-lg hover:bg-gray-100 transition-colors"
              >
                Explore Map
              </Link>
              <Link 
                to="/gallery" 
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-md font-medium text-lg hover:bg-white/10 transition-colors"
              >
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Professional Geo-Tagging Features
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to organize, display, and share your location-based photography.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Precise Geo-Tagging
              </h3>
              <p className="text-gray-600">
                Tag your photos with exact GPS coordinates or easily place them on an interactive map with our intuitive interface.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Map className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Interactive Maps
              </h3>
              <p className="text-gray-600">
                Create beautiful, interactive maps showing your photo locations. Filter by date, category, or custom tags.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Photo Galleries
              </h3>
              <p className="text-gray-600">
                Organize your geo-tagged photos into stunning galleries, sorted by location, time, or custom categories.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Edit className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Edit Geo-Data
              </h3>
              <p className="text-gray-600">
                Easily modify location data, even for photos that weren't originally geotagged. Add, edit, or remove coordinates.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Image className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Professional Watermarking
              </h3>
              <p className="text-gray-600">
                Protect your work with customizable watermarks. Add your logo, name, or location data directly on your photos.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Privacy Controls
              </h3>
              <p className="text-gray-600">
                Control who can see your photos and their location data. Keep sensitive locations private with advanced privacy settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Visualize Your Photography Journey
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Create beautiful maps showing where each photo was taken. Organize by trips, themes, or projects to tell your visual story through geography.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Interactive maps with clustered photo markers
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Custom map styles to match your photography aesthetic
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Route tracking for travel photography journeys
                  </p>
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  to="/map"
                  className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium text-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Try Interactive Map
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img 
                  src="https://images.pexels.com/photos/6147037/pexels-photo-6147037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Interactive map with photo locations" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <Map className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Watermark Feature Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between md:flex-row-reverse">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pl-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Professional Watermarking
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Protect your work with customizable watermarks while maintaining the visual impact of your photography. Add location data, copyright information, or your personal branding.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Customizable watermark styles, opacity, and positioning
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Include location data automatically in your watermarks
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">✓</div>
                  </div>
                  <p className="ml-3 text-gray-600">
                    Batch processing for consistent branding across galleries
                  </p>
                </li>
              </ul>
              <div className="mt-8">
                <button className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium text-lg hover:bg-blue-700 transition-colors">
                  Try Watermarking
                </button>
              </div>
            </div>
            <div className="md:w-1/2 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img 
                  src="https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Photo with watermark" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 py-1 px-3 rounded flex items-center shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium text-gray-900">GeoTag Pro • 34.0522° N, 118.2437° W</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Start Your Geo-Tagged Photography Journey
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of photographers who use GeoTag Pro to organize, showcase, and protect their location-based photography.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-700 rounded-md font-medium text-lg hover:bg-gray-100 transition-colors">
              Create Free Account
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-md font-medium text-lg hover:bg-white/10 transition-colors">
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Photographers Are Saying
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied photographers who use GeoTag Pro.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Sarah Johnson</h4>
                  <p className="text-gray-600">Travel Photographer</p>
                </div>
              </div>
              <p className="text-gray-600">
                "GeoTag Pro has revolutionized how I organize my travel photography. Being able to see all my photos on a map helps me tell better stories about my journeys."
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Michael Chen</h4>
                  <p className="text-gray-600">Landscape Photographer</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The watermarking feature saves me so much time. I can batch process my photos while adding location data that enhances the story behind each image."
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold">Emma Rodriguez</h4>
                  <p className="text-gray-600">Wildlife Photographer</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The privacy controls are essential for my wildlife work. I can share beautiful images while protecting sensitive locations of endangered species."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;