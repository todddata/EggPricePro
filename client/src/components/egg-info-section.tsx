import { Card, CardContent } from "@/components/ui/card";

export default function EggInfoSection() {
  return (
    <Card className="mt-6 bg-white shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">About Cage-Free Eggs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <p className="text-gray-600 mb-4">
              Cage-free eggs come from hens that aren't confined to cages, allowing them more freedom to move around in barns or warehouses. 
              Brown and white eggs differ only in shell color - the nutrition and taste are generally the same.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Brown Eggs</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Produced by breeds like Rhode Island Reds</li>
                  <li>• Shell color comes from breed genetics</li>
                  <li>• Often perceived as more natural</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">White Eggs</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Produced by breeds like Leghorns</li>
                  <li>• Generally more common in stores</li>
                  <li>• Same nutritional value as brown eggs</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            {/* Egg display image placeholder */}
            <div className="w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center h-48">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-24 h-24 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              Cage-free egg display at a local grocery store
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
