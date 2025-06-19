import { PawPrint as Paw, Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {/* <Paw size={24} className="text-primary-400" /> */}
              <img src="/logo_new.png" width={100} />
            </div>
            <p className="text-gray-300 mb-4">
              Your one-stop shop for all pet needs in the Philippines.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61577241581092" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-400 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/furk.app?igsh=NXF6NmhscjlnMmVw" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-400 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@furk.app?_r=1&_d=eahe2ma3a5ke4m&sec_uid=MS4wLjABAAAA8mASraSu8yW6gH8pMRuFCCxvHau_Y8yn5z7A_E8mT0UyIdvNY2ShRKWHR_39OHyg&share_author_id=7047577459487622145&sharer_language=en&source=h5_t&u_code=dl19a0iale42jg&timestamp=1750343448&user_id=7014023541038302210&sec_user_id=MS4wLjABAAAAKQ76qrqkAo-hgznyLU4YNinKHTXzZxrHw2dn74EQgQ7VLQrRR5pcJlARsgiOn8zo&utm_source=copy&utm_campaign=client_share&utm_medium=android&share_iid=7517082608950707975&share_link_id=099bd5bb-3b4c-478a-bc8f-e8b8802a4623&share_app_id=1180&ugbiz_name=ACCOUNT&ug_btm=b2001%2Cb5836&social_share_type=5&enable_checksum=1" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-400 transition-colors">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="mailto:support@furk.app" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-400 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Rewards Program
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Login / Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Pet Grooming
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Vet Services
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Pet Boarding
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Pet Training
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-300 mb-2">
              Email: support@furk.app
            </p>
            <p className="text-gray-300 mb-4">
              Phone: +63 917 821 0408
            </p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
              Contact Support
            </button>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© {currentYear} FURK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;