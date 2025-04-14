import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      {/* This is a blank profile page as requested */}
      <div className="p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
        <p className="text-muted-foreground">
          This is a blank profile page. All personal information has been moved to the Settings page.
        </p>
      </div>
    </div>
  );
} 