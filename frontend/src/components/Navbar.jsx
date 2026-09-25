import { Link, useNavigate } from "react-router-dom";
import { VenetianMask } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileButton from "./profile/ProfileButton";

export default function Navbar() {
  const isAuthed = Boolean(localStorage.getItem("access_token"));

  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    await navigate("/login");
  };

  return (
    <header className="border-b border-border sticky top-0 bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <VenetianMask className="h-5 w-5 text-primary" />
          <span className="font-display text-lg">Incogni</span>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthed ? (
            <>
              <ProfileButton />
              <Button onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost">
                <Link to="/login">Log in</Link>
              </Button>
              <Button>
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
