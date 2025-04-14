import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          tooltip="Profile"
        >
          <Link to="/profile">
            <User />
            <span>Profile</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          tooltip="Settings"
        >
          <Link to="/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      <SidebarMenuItem>
        <SidebarMenuButton 
          tooltip="Sign Out"
          onClick={handleSignOut}
        >
          <LogOut />
          <span>Sign Out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

export function UserButton() {
  const navigate = useNavigate();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip="Sign In" onClick={() => navigate("/signin")}>
        <User />
        <span>Sign In</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
} 