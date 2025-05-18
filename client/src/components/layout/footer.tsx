import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Egg Price Tracker</h3>
            <p className="text-gray-400 text-sm">
              Track the best prices for eggs in your area with our comprehensive price comparison tool.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
            <p className="text-gray-400 text-sm">
              Have questions or feedback? Reach out to our team.
            </p>
            <a 
              href="mailto:info@eggpricetracker.com" 
              className="text-primary hover:text-white text-sm"
            >
              info@eggpricetracker.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Egg Price Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
