import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

// Form validation schema
const searchSchema = z.object({
  zipCode: z.string().regex(/^\d{5}$/, "Zip code must be 5 digits"),
  radius: z.number().int().min(1).max(20),
  eggType: z.enum(["brown", "white"])
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SearchFormProps {
  initialZipCode: string;
  initialRadius: number;
  initialEggType: "brown" | "white";
  onSearch: (zipCode: string, radius: number, eggType: "brown" | "white") => void;
}

export default function SearchForm({ 
  initialZipCode, 
  initialRadius, 
  initialEggType, 
  onSearch 
}: SearchFormProps) {
  const [radiusValue, setRadiusValue] = useState(initialRadius);
  const { toast } = useToast();
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      zipCode: initialZipCode,
      radius: initialRadius,
      eggType: initialEggType
    }
  });
  
  const handleSubmit = (values: SearchFormValues) => {
    // Add a console log to verify the search values
    console.log("Searching with values:", values);
    onSearch(values.zipCode, values.radius, values.eggType);
  };
  
  const updateRadius = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setRadiusValue(value);
    form.setValue("radius", value);
    
    // Trigger the search with the current form values when radius changes
    const zipCode = form.getValues("zipCode");
    const eggType = form.getValues("eggType");
    
    // Only trigger search if zipCode is valid (5 digits)
    if (/^\d{5}$/.test(zipCode)) {
      console.log("Auto-searching on radius change:", { zipCode, radius: value, eggType });
      onSearch(zipCode, value, eggType);
    }
  };
  
  const toggleEggType = (checked: boolean) => {
    const eggType = checked ? "brown" : "white";
    form.setValue("eggType", eggType);
    
    // Also trigger a search when egg type changes
    const zipCode = form.getValues("zipCode");
    const radius = form.getValues("radius");
    
    // Only trigger search if zipCode is valid
    if (/^\d{5}$/.test(zipCode)) {
      console.log("Auto-searching on egg type change:", { zipCode, radius, eggType });
      onSearch(zipCode, radius, eggType);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Find Egg Prices Near You</h2>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Zip Code Input */}
            <div className="col-span-1">
              <Label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </Label>
              <div className="flex">
                <Input
                  id="zipCode"
                  type="text"
                  className="block w-full rounded-l-md"
                  placeholder="Enter zip code"
                  {...form.register("zipCode")}
                />
                <Button 
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary/90 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              {form.formState.errors.zipCode && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.zipCode.message}</p>
              )}
            </div>
            
            {/* Radius Selector */}
            <div className="col-span-1">
              <Label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius: <span id="radius-value">{radiusValue}</span> miles
              </Label>
              <Input 
                id="radius"
                type="range" 
                min="1" 
                max="20" 
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                value={radiusValue}
                onChange={updateRadius}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 mi</span>
                <span>20 mi</span>
              </div>
              {form.formState.errors.radius && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.radius.message}</p>
              )}
            </div>
            
            {/* Egg Type Toggle */}
            <div className="col-span-1">
              <Label className="block text-sm font-medium text-gray-700 mb-3">Egg Type</Label>
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${form.watch("eggType") === "white" ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                  White
                </span>
                <Switch 
                  checked={form.watch("eggType") === "brown"}
                  onCheckedChange={toggleEggType}
                />
                <span className={`text-sm ${form.watch("eggType") === "brown" ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                  Brown
                </span>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
