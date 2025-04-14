import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");

  // These would be stored in a user preferences table in Supabase
  const [notifications, setNotifications] = useState({
    email: true,
    marketAlerts: false,
    portfolioUpdates: true,
  });

  // Fetch user preferences when component loads
  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  // Get user preferences from the database
  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        toast.error("Failed to load preferences");
        console.error(error);
        return;
      }
      
      if (data) {
        setNotifications({
          email: data.email_notifications,
          marketAlerts: data.market_alerts,
          portfolioUpdates: data.portfolio_updates
        });
      } else {
        // If no preferences found, create default preferences
        saveUserPreferences({
          email: true,
          marketAlerts: false,
          portfolioUpdates: true
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveUserPreferences = async (prefs = notifications) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          email_notifications: prefs.email,
          market_alerts: prefs.marketAlerts,
          portfolio_updates: prefs.portfolioUpdates,
          updated_at: new Date()
        })
        .select();
        
      if (error) {
        toast.error("Failed to save preferences");
        console.error(error);
        return;
      }
      
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotificationChange = (setting: keyof typeof notifications) => {
    const updatedNotifications = {
      ...notifications,
      [setting]: !notifications[setting],
    };
    
    setNotifications(updatedNotifications);
    
    // Save to Supabase
    saveUserPreferences(updatedNotifications);
    toast.success(`${setting} notifications ${notifications[setting] ? 'disabled' : 'enabled'}`);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    
    try {
      // Using the server-side RPC function to handle account deletion
      const { data, error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        toast.error(error.message);
        setIsDeletingAccount(false);
        setShowDeleteConfirmation(false);
        return;
      }
      
      if (!data.success) {
        toast.error(data.error || "Failed to delete account");
        setIsDeletingAccount(false);
        setShowDeleteConfirmation(false);
        return;
      }
      
      // Show success message before sign out
      toast.success("Your account has been deleted");
      
      // Do navigation first, then sign out
      navigate("/");
      
      // Small delay to ensure toast is shown and navigation completes
      setTimeout(async () => {
        try {
          await signOut();
        } catch (error) {
          console.error("Error during sign out after account deletion:", error);
        } finally {
          setIsDeletingAccount(false);
          setShowDeleteConfirmation(false);
        }
      }, 500);
    } catch (error) {
      toast.error("Failed to delete account");
      console.error(error);
      setIsDeletingAccount(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              <Avatar className="h-20 w-20 mr-4">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{fullName || user?.email?.split('@')[0]}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  type="email"
                />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>
              
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about your account activity
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={notifications.email}
                onCheckedChange={() => handleNotificationChange('email')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="market-alerts" className="font-medium">
                  Market Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about significant market movements
                </p>
              </div>
              <Switch 
                id="market-alerts" 
                checked={notifications.marketAlerts}
                onCheckedChange={() => handleNotificationChange('marketAlerts')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="portfolio-updates" className="font-medium">
                  Portfolio Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your portfolio performance
                </p>
              </div>
              <Switch 
                id="portfolio-updates" 
                checked={notifications.portfolioUpdates}
                onCheckedChange={() => handleNotificationChange('portfolioUpdates')}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Permanent account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once your account is deleted, all of your data will be permanently removed. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 