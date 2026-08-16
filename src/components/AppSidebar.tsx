import { Home, BarChart, LineChart, BarChart2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarTrigger, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { UserMenu, UserButton } from "./UserMenu";
import { useAuth } from "@/lib/auth";

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { user, isLoading } = useAuth();
  
  // Define navigation items
  const navItems = [
    {
      title: "Home",
      path: "/",
      icon: Home,
    },
    {
      title: "Portfolio Optimizer",
      path: "/optimizer",
      icon: BarChart,
    },
    {
      title: "Market News",
      path: "/market-news",
      icon: LineChart,
    },
    {
      title: "Stock Analysis",
      path: "/stock-analysis",
      icon: BarChart2,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex h-12 items-center px-4">
          <SidebarTrigger />
          {state === "expanded" && <span className="ml-2 text-lg font-semibold">Asset Optimizer</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={location.pathname === item.path || 
                              (item.path === "/optimizer" && location.pathname === "/")}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* User Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isLoading && (
                user ? <UserMenu /> : <UserButton />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
