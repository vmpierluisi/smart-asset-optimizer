import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Country options
const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", 
  "France", "Japan", "China", "India", "Brazil", "Other"
];

// Reasons for using the platform
const reasonOptions = [
  "Personal Investment", "Professional Investment", "Financial Education",
  "Academic Research", "Business Analysis", "Other"
];

// How they found the platform
const referralOptions = [
  "Search Engine", "Social Media", "Friend or Colleague", 
  "Professional Recommendation", "Advertisement", "Other"
];

export function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    reason: "",
    referral: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.name || !formData.email || !formData.password || 
        !formData.country || !formData.reason || !formData.referral) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the user account with profile data
      const { error } = await signUp(
        formData.email, 
        formData.password,
        {
          name: formData.name,
          country: formData.country,
          reason_for_use: formData.reason,
          referral_source: formData.referral
        }
      );
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Signed up successfully! Please check your email for verification.");
      navigate("/signin");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md bg-neutral-50 rounded-lg border-0 shadow-none">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Fill in your details to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country of Residence</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => handleSelectChange("country", value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Using Platform</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value) => handleSelectChange("reason", value)}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referral">How did you find us?</Label>
              <Select 
                value={formData.referral} 
                onValueChange={(value) => handleSelectChange("referral", value)}
              >
                <SelectTrigger id="referral">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {referralOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/signin")}
            disabled={isLoading}
          >
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 