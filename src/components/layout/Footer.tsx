import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Github as GitHub, Twitter, Instagram, Camera, Image, Map, Shield, Edit, Mail, Heart, BookOpen, HelpCircle, FileText, Users, Code, Award, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <footer className={`${isDarkMode 
      ? 'bg-gray-900 border-gray-800 text-gray-400' 
      : 'bg-gradient-to-b from-neutral-50 to-neutral-100 border-neutral-200 text-primary-500'} border-t transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="col-span-1">
            {/* Creator credit with highlighted text */}
            <div className="flex items-center mb-5 w-max py-2 px-3 rounded-full shadow-md bg-gradient-to-r from-purple-600/10 to-purple-400/10 dark:from-purple-900/30 dark:to-purple-700/30 border border-purple-200 dark:border-purple-800 backdrop-blur-sm">
              <Heart className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400 animate-pulse" />
              <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
                Made by Rishit Tandon
              </span>
            </div>
            
            <Link to="/" className="flex items-center group">
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center group-hover:from-primary-dark group-hover:to-primary-dark transition-all duration-300 shadow-md">
                <MapPin className="h-6 w-6 text-neutral-50" />
              </div>
              <span className={`ml-2 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-primary'}`}>GeoTag Pro</span>
            </Link>
            <p className={`mt-3 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
              Professional geo-tagged photo platform for photographers and explorers. Capture, organize, and share your visual journey with precise location data.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="https://github.com/RishitTandon7" target="_blank" rel="noopener noreferrer" className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-purple-400' 
                : 'bg-neutral-50 text-primary hover:bg-neutral-100 hover:text-accent'}`}>
                <GitHub className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/in/rishit-tandon-928661287/" target="_blank" rel="noopener noreferrer" className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-purple-400' 
                : 'bg-neutral-50 text-primary hover:bg-neutral-100 hover:text-accent'}`}>
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/kingrishit2.0/" target="_blank" rel="noopener noreferrer" className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-purple-400' 
                : 'bg-neutral-50 text-primary hover:bg-neutral-100 hover:text-accent'}`}>
                <Instagram className="h-4 w-4" />
              </a>
              <a href="mailto:contact@geotagpro.com" className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${isDarkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-purple-400' 
                : 'bg-neutral-50 text-primary hover:bg-neutral-100 hover:text-accent'}`}>
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold tracking-wider uppercase border-b pb-2 ${isDarkMode 
              ? 'text-gray-300 border-gray-700' 
              : 'text-primary border-neutral-200'}`}>
              Features
            </h3>
            <ul className="mt-4 space-y-2">
              <li className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'}`}>
                  <MapPin className={`h-3 w-3 ${isDarkMode ? 'text-purple-400' : 'text-primary'}`} />
                </div>
                <span className="text-sm">Precise Geo-Tagging</span>
              </li>
              <li className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'}`}>
                  <Map className={`h-3 w-3 ${isDarkMode ? 'text-purple-400' : 'text-primary'}`} />
                </div>
                <span className="text-sm">Interactive Maps</span>
              </li>
              <li className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'}`}>
                  <Image className={`h-3 w-3 ${isDarkMode ? 'text-purple-400' : 'text-primary'}`} />
                </div>
                <span className="text-sm">Photo Galleries</span>
              </li>
              <li className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'}`}>
                  <Edit className={`h-3 w-3 ${isDarkMode ? 'text-purple-400' : 'text-primary'}`} />
                </div>
                <span className="text-sm">Custom Watermarking</span>
              </li>
              <li className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-primary-600'}`}>
                <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'}`}>
                  <Code className={`h-3 w-3 ${isDarkMode ? 'text-purple-400' : 'text-primary'}`} />
                </div>
                <span className="text-sm">API Access</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-neutral-200'}`}>
          <div className="md:flex md:items-center md:justify-between">
            <p className="text-sm">
              &copy; {currentYear} GeoTag Pro. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6">
                <Link to="/pricing" className={`text-sm hover:text-accent transition-colors ${isDarkMode ? 'text-gray-400' : 'text-primary-500'}`}>
                  Pricing
                </Link>
                <Link to="/" className={`text-sm hover:text-accent transition-colors ${isDarkMode ? 'text-gray-400' : 'text-primary-500'}`}>
                  Sitemap
                </Link>
                <Link to="/" className={`text-sm hover:text-accent transition-colors ${isDarkMode ? 'text-gray-400' : 'text-primary-500'}`}>
                  Cookie Preferences
                </Link>
                <Link to="/" className={`text-sm hover:text-accent transition-colors ${isDarkMode ? 'text-gray-400' : 'text-primary-500'}`}>
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;