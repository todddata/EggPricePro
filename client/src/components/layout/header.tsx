interface HeaderProps {
  lastUpdated: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary w-8 h-8 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h4.5a3 3 0 013 3v8.25M3 8.25h.75m0 0h.75m-.75 0v-.75m.75.75h.75M3 12h4.5m-4.5 0h3.75m-3.75 0v-.75m3.75.75h.75M3 15.75h3.75m-3.75 0h.75m-.75 0v-.75m.75.75H7.5" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Egg Price Tracker</h1>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: <span>{lastUpdated}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
