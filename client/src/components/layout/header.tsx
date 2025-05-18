interface HeaderProps {
  lastUpdated: string;
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="Egg Tracker Logo" 
              className="h-12 w-auto mr-3" 
            />
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
