// src/App.jsx
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';

function ThemeToggle() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white bg-gray-200 text-black"
    >
      Toggle Theme
    </button>
  );
}

function SpellList() {
  const [spells, setSpells] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [displayFilter, setDisplayFilter] = useState('');

  const handleFilter = (column, value) => {
    switch (column) {
      case 'name':
        setFilter(value);
        break;
      case 'level':
        setLevelFilter(value);
        break;
      case 'school':
        setSchoolFilter(value);
        break;
      default:
        break;
    }
  };

  const toggleFilter = (column) => {
    setDisplayFilter(displayFilter === column ? '' : column);
  };

  useEffect(() => {
    const params = new URLSearchParams({
      page,
      limit,
      sort: sortKey,
      order: sortOrder,
      name: filter,
      level: levelFilter,
      school: schoolFilter,
    });
    fetch(`/api/spells?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setSpells(data.results);
        setTotal(data.total);
      });
  }, [page, sortKey, sortOrder, filter, levelFilter, schoolFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Spells</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="cursor-pointer border-b p-2 text-left">
              Name
              <button onClick={(e) => { e.stopPropagation(); toggleFilter('name'); }} className="ml-2">
                {filter ? '🔍' : '🔎'}
              </button>
              {displayFilter === 'name' && (
                <div className="absolute mt-2 p-2 bg-opacity-100 bg-white border border-gray-300 rounded shadow-lg">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => handleFilter('name', e.target.value)}
                    className="p-1 border rounded w-full dark:bg-gray-800"
                    placeholder="Filter by name..."
                  />
                </div>
              )}
            </th>
            <th onClick={() => handleSort('level')} className="cursor-pointer border-b p-2 text-left">
              Level
              <button onClick={(e) => { e.stopPropagation(); toggleFilter('level'); }} className="ml-2">
                {levelFilter ? '🔍' : '🔎'}
              </button>
              {displayFilter === 'level' && (
                <div className="absolute mt-2 p-2 bg-opacity-100 bg-white border border-gray-300 rounded shadow-lg">
                  <input
                    type="number"
                    value={levelFilter}
                    onChange={(e) => handleFilter('level', e.target.value)}
                    className="p-1 border rounded w-full dark:bg-gray-800"
                    placeholder="Filter by level..."
                  />
                </div>
              )}
            </th>
            <th onClick={() => handleSort('school')} className="cursor-pointer border-b p-2 text-left">
              School
              <button onClick={(e) => { e.stopPropagation(); toggleFilter('school'); }} className="ml-2">
                {schoolFilter ? '🔍' : '🔎'}
              </button>
              {displayFilter === 'school' && (
                <div className="absolute mt-2 p-2 bg-opacity-100 bg-white border border-gray-300 rounded shadow-lg">
                  <input
                    type="text"
                    value={schoolFilter}
                    onChange={(e) => handleFilter('school', e.target.value)}
                    className="p-1 border rounded w-full dark:bg-gray-800"
                    placeholder="Filter by school..."
                  />
                </div>
              )}
            </th>
            <th className="border-b p-2 text-left">Descriptors</th>
            <th className="border-b p-2 text-left">Casting Time</th>
            <th className="border-b p-2 text-left">Range</th>
            <th className="border-b p-2 text-left">Duration</th>
            <th className="border-b p-2 text-left">Components</th>
          </tr>
        </thead>
        <tbody>
          {spells.map(spell => (
            <tr key={spell.spell_id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <td className="p-2">
                <Link to={`/spells/${spell.spell_id}`} className="text-blue-600 hover:underline">
                  {spell.spell_name}
                </Link>
              </td>
              <td className="p-2">{spell.spell_level}</td>
              <td className="p-2">{spell.schools.join(', ')}</td>
              <td className="p-2">{spell.descriptors.join(', ')}</td>
              <td className="p-2">{spell.casting_time}</td>
              <td className="p-2">{spell.spell_range}</td>
              <td className="p-2">{spell.duration}</td>
              <td className="p-2">{spell.components}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between items-center">
        <div>
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} spells
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchParams({ page: 1 })}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setSearchParams({ page: page - 1 })}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setSearchParams({ page: page + 1 })}
            disabled={page >= Math.ceil(total / limit)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setSearchParams({ page: Math.ceil(total / limit) })}
            disabled={page >= Math.ceil(total / limit)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}

function SpellDetail() {
  const { id } = useParams();
  const [spell, setSpell] = useState(null);

  useEffect(() => {
    fetch(`/api/spells/${id}`)
      .then(res => res.json())
      .then(setSpell);
  }, [id]);

  if (!spell) return <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">Loading...</div>;

  return (
    <div className="p-4 bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-2">{spell.spell_name}</h1>
      <p><strong>Level:</strong> {spell.spell_level}</p>
      <p><strong>School:</strong> {spell.schools.join(', ')}</p>
      <p className="mt-4 whitespace-pre-line">{spell.spell_description}</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">Back to List</Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<SpellList />} />
        <Route path="/spells/:id" element={<SpellDetail />} />
      </Routes>
    </Router>
  );
}
