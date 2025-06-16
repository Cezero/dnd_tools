import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/authProvider';
import ThemeToggle from './themeToggle';
import { useState, useRef, useEffect } from 'react';
import LookupService from '@/services/LookupService';
import { featureNavigation } from '@/features/featureRoutes';

export default function Navbar() {
  const { user, logout, updatePreferredEdition } = useAuth();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState('4'); // Default to combined 3E/3.5E (edition_id 4)

  const COMBINED_3E_ID = '4'; // The edition_id for 3E, which will represent the combined 3E/3.5E option

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    async function loadEditions() {
      await LookupService.initialize();
      const fetchedEditions = LookupService.getAll('editions');

      let currentEditionOptions = [];
      fetchedEditions.forEach(edition => {
        // Exclude individual 3E and 3.5E options, as combined is preferred
        if (edition.edition_id !== 4 && edition.edition_id !== 5) { // Assuming 3E is 4, 3.5E is 5
          currentEditionOptions.push({
            value: String(edition.edition_id),
            label: edition.edition_abbrev,
          });
        }
      });

      // Sort initially by edition_id to maintain natural order of remaining editions
      currentEditionOptions.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));

      // Add combined 3E/3.5E option
      const combinedOption = { value: String(COMBINED_3E_ID), label: '3E/3.5E Combined' };

      // Find the edition IDs for AD&D 2E and 4E for precise insertion
      const adnd2eEntry = fetchedEditions.find(e => e.edition_abbrev === 'AD&D 2E');
      const fourEEntry = fetchedEditions.find(e => e.edition_abbrev === '4E');

      let insertIndex = currentEditionOptions.length; // Default to end

      if (fourEEntry) {
        // If 4E is present, insert before it
        insertIndex = currentEditionOptions.findIndex(option => parseInt(option.value, 10) === fourEEntry.edition_id);
        if (insertIndex === -1) { // Fallback if 4E was somehow filtered out or not found in current options
          insertIndex = currentEditionOptions.length;
        }
      } else if (adnd2eEntry) {
        // If 4E is not present, but AD&D 2E is, insert after AD&D 2E
        insertIndex = currentEditionOptions.findIndex(option => parseInt(option.value, 10) === adnd2eEntry.edition_id);
        if (insertIndex !== -1) {
          insertIndex += 1; // Insert after AD&D 2E
        }
      }

      currentEditionOptions.splice(insertIndex, 0, combinedOption);

      setEditions(currentEditionOptions);

      // Set initial selected edition from user profile or default
      if (user?.preferred_edition_id) {
        setSelectedEdition(String(user.preferred_edition_id));
      } else {
        setSelectedEdition(String(COMBINED_3E_ID));
      }
    }

    loadEditions();

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]); // Depend on user to re-evaluate preferred edition on login/logout

  const handleEditionChange = async (event) => {
    const newEditionId = event.target.value;
    setSelectedEdition(newEditionId);
    // Send the actual edition ID for the combined option (which is 4) to the backend
    const editionIdForBackend = parseInt(newEditionId, 10);
    await updatePreferredEdition(editionIdForBackend);
  };

  return (
    <nav className="bg-gray-100 dark:bg-gray-800 h-11 shadow flex">
      <div className="flex items-center pl-4">
        <Link to="/" className="font-bold text-lg">DnD Tools</Link>
      </div>
      <div className="flex items-end space-x-1 ml-6">
        {featureNavigation.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg 
                ${isActive ? 'bg-white dark:bg-gray-900 font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-end space-x-1 mr-6 ml-auto">
        {user && user.is_admin && (
          <Link
            to="/admin"
            className={`px-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg 
              ${location.pathname.startsWith('/admin') ? 'bg-white dark:bg-gray-900 font-bold' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center space-x-2 pr-4">
        {editions.length > 0 && (
          <select
            value={selectedEdition}
            onChange={handleEditionChange}
            className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white text-sm px-2 py-1 rounded focus:outline-none"
          >
            {editions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {user ? (
          <div className="relative">
            <button onClick={toggleDropdown} className="text-sm items-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
              Logged in as <strong>{user.username}</strong>
            </button>
            {isDropdownOpen && (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setIsDropdownOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Login</Link>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
